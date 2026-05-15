from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Optional
from ..schemas import ApplicationCreate, ApplicationStatusUpdate
from ..auth import get_current_user, require_employer, require_candidate
from ..database import get_db, dict_from_row, dicts_from_rows
from ..email import send_application_confirmation, send_status_update, send_new_application_alert

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.post("")
async def create_application(
    data: ApplicationCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_candidate)
):
    """Apply for a job (candidate only)."""
    db = get_db()

    # Check if job exists and is open
    job = db.execute("SELECT * FROM jobs WHERE id = ?", (data.job_id,)).fetchone()
    if not job:
        db.close()
        raise HTTPException(status_code=404, detail="Job not found")

    job_dict = dict(job)
    if job_dict["status"] != "open":
        db.close()
        raise HTTPException(status_code=400, detail="This job is no longer accepting applications")

    # Check if already applied
    existing = db.execute(
        "SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?",
        (current_user["id"], data.job_id)
    ).fetchone()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="You have already applied for this job")

    # Create application
    cursor = db.execute(
        """INSERT INTO applications (status, cover_letter, candidate_id, job_id)
           VALUES ('applied', ?, ?, ?)""",
        (data.cover_letter, current_user["id"], data.job_id)
    )
    db.commit()
    app_id = cursor.lastrowid

    # Record initial status change
    db.execute(
        """INSERT INTO status_changes (from_status, to_status, note, application_id)
           VALUES ('none', 'applied', 'Application submitted', ?)""",
        (app_id,)
    )
    db.commit()

    # Fetch the created application with job info
    row = db.execute(
        """SELECT a.*, j.title as job_title, j.company as job_company, j.location as job_location
           FROM applications a
           JOIN jobs j ON a.job_id = j.id
           WHERE a.id = ?""",
        (app_id,)
    ).fetchone()

    # Get employer info for notification
    employer = db.execute("SELECT * FROM users WHERE id = ?", (job_dict["employer_id"],)).fetchone()
    db.close()

    # Send emails in background
    background_tasks.add_task(
        send_application_confirmation,
        current_user["email"], current_user["name"],
        job_dict["title"], job_dict["company"]
    )
    if employer:
        employer_dict = dict(employer)
        background_tasks.add_task(
            send_new_application_alert,
            employer_dict["email"], employer_dict["name"],
            current_user["name"], job_dict["title"]
        )

    return dict_from_row(row)


@router.get("")
def list_applications(
    status: Optional[str] = Query(None),
    job_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """List applications. Candidates see their own, employers see apps for their jobs."""
    db = get_db()
    conditions = []
    params = []

    if current_user["role"] == "candidate":
        conditions.append("a.candidate_id = ?")
        params.append(current_user["id"])
    else:
        # Employer sees applications for their jobs
        conditions.append("j.employer_id = ?")
        params.append(current_user["id"])

    if status:
        conditions.append("a.status = ?")
        params.append(status)

    if job_id:
        conditions.append("a.job_id = ?")
        params.append(job_id)

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    # Count
    count_query = f"""
        SELECT COUNT(*) as total
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE {where_clause}
    """
    total = db.execute(count_query, params).fetchone()["total"]

    # Paginated results
    offset = (page - 1) * limit
    query = f"""
        SELECT a.*, j.title as job_title, j.company as job_company, j.location as job_location,
               j.job_type, j.status as job_status,
               u.name as candidate_name, u.email as candidate_email,
               u.skills as candidate_skills, u.location as candidate_location
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON a.candidate_id = u.id
        WHERE {where_clause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    rows = db.execute(query, params).fetchall()
    db.close()

    return {
        "applications": dicts_from_rows(rows),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0
    }


@router.get("/{application_id}")
def get_application(application_id: int, current_user: dict = Depends(get_current_user)):
    """Get application detail with status history."""
    db = get_db()

    row = db.execute(
        """SELECT a.*, j.title as job_title, j.company as job_company, j.location as job_location,
                  j.job_type, j.description as job_description, j.status as job_status,
                  u.name as candidate_name, u.email as candidate_email,
                  u.skills as candidate_skills, u.phone as candidate_phone,
                  u.location as candidate_location, u.bio as candidate_bio,
                  u.resume_filename as candidate_resume_filename
           FROM applications a
           JOIN jobs j ON a.job_id = j.id
           JOIN users u ON a.candidate_id = u.id
           WHERE a.id = ?""",
        (application_id,)
    ).fetchone()

    if not row:
        db.close()
        raise HTTPException(status_code=404, detail="Application not found")

    app_dict = dict_from_row(row)

    # Check access - candidate can see their own, employer can see for their jobs
    if current_user["role"] == "candidate" and app_dict["candidate_id"] != current_user["id"]:
        db.close()
        raise HTTPException(status_code=403, detail="Access denied")

    if current_user["role"] == "employer":
        job = db.execute("SELECT employer_id FROM jobs WHERE id = ?", (app_dict["job_id"],)).fetchone()
        if not job or dict(job)["employer_id"] != current_user["id"]:
            db.close()
            raise HTTPException(status_code=403, detail="Access denied")

    # Get status history
    history_rows = db.execute(
        "SELECT * FROM status_changes WHERE application_id = ? ORDER BY created_at ASC",
        (application_id,)
    ).fetchall()
    db.close()

    app_dict["status_history"] = dicts_from_rows(history_rows)
    return app_dict


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_employer)
):
    """Update application status (employer only). Triggers email notification."""
    valid_statuses = ["applied", "reviewing", "shortlisted", "interview", "offered", "rejected", "withdrawn"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    db = get_db()

    # Get application with job info
    app_row = db.execute(
        """SELECT a.*, j.employer_id, j.title as job_title, j.company as job_company
           FROM applications a
           JOIN jobs j ON a.job_id = j.id
           WHERE a.id = ?""",
        (application_id,)
    ).fetchone()

    if not app_row:
        db.close()
        raise HTTPException(status_code=404, detail="Application not found")

    app_dict = dict(app_row)

    # Check ownership
    if app_dict["employer_id"] != current_user["id"]:
        db.close()
        raise HTTPException(status_code=403, detail="You can only update applications for your own jobs")

    old_status = app_dict["status"]
    if old_status == data.status:
        db.close()
        raise HTTPException(status_code=400, detail="Application is already in this status")

    # Update status
    db.execute(
        "UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?",
        (data.status, application_id)
    )

    # Record status change
    db.execute(
        """INSERT INTO status_changes (from_status, to_status, note, application_id)
           VALUES (?, ?, ?, ?)""",
        (old_status, data.status, data.note, application_id)
    )
    db.commit()

    # Get candidate for email
    candidate = db.execute("SELECT * FROM users WHERE id = ?", (app_dict["candidate_id"],)).fetchone()

    # Get updated application
    updated_row = db.execute(
        """SELECT a.*, j.title as job_title, j.company as job_company, j.location as job_location,
                  u.name as candidate_name, u.email as candidate_email
           FROM applications a
           JOIN jobs j ON a.job_id = j.id
           JOIN users u ON a.candidate_id = u.id
           WHERE a.id = ?""",
        (application_id,)
    ).fetchone()
    db.close()

    # Send email notification in background
    if candidate:
        candidate_dict = dict(candidate)
        background_tasks.add_task(
            send_status_update,
            candidate_dict["email"], candidate_dict["name"],
            app_dict["job_title"], app_dict["job_company"],
            old_status, data.status
        )

    return dict_from_row(updated_row)

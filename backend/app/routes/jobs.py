from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from ..schemas import JobCreate, JobUpdate, JobStatusUpdate
from ..auth import get_current_user, require_employer
from ..database import get_db, dict_from_row, dicts_from_rows

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("")
def list_jobs(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    location_type: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    salary_min: Optional[int] = Query(None),
    salary_max: Optional[int] = Query(None),
    status: Optional[str] = Query("open"),
    employer_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    """List jobs with search, filter, and pagination."""
    db = get_db()

    conditions = []
    params = []

    if status:
        conditions.append("j.status = ?")
        params.append(status)

    if search:
        conditions.append("(j.title LIKE ? OR j.description LIKE ? OR j.company LIKE ?)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])

    if category:
        conditions.append("j.category = ?")
        params.append(category)

    if location:
        conditions.append("j.location LIKE ?")
        params.append(f"%{location}%")

    if location_type:
        conditions.append("j.location_type = ?")
        params.append(location_type)

    if job_type:
        conditions.append("j.job_type = ?")
        params.append(job_type)

    if salary_min is not None:
        conditions.append("(j.salary_max >= ? OR j.salary_max IS NULL)")
        params.append(salary_min)

    if salary_max is not None:
        conditions.append("(j.salary_min <= ? OR j.salary_min IS NULL)")
        params.append(salary_max)

    if employer_id is not None:
        conditions.append("j.employer_id = ?")
        params.append(employer_id)

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    # Get total count
    count_query = f"SELECT COUNT(*) as total FROM jobs j WHERE {where_clause}"
    total = db.execute(count_query, params).fetchone()["total"]

    # Get paginated results
    offset = (page - 1) * limit
    query = f"""
        SELECT j.*, u.name as employer_name,
               (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
        FROM jobs j
        LEFT JOIN users u ON j.employer_id = u.id
        WHERE {where_clause}
        ORDER BY j.created_at DESC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    rows = db.execute(query, params).fetchall()
    db.close()

    jobs = dicts_from_rows(rows)

    return {
        "jobs": jobs,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0
    }


@router.get("/categories")
def list_categories():
    """Get all unique job categories."""
    db = get_db()
    rows = db.execute("SELECT DISTINCT category FROM jobs WHERE status = 'open' ORDER BY category").fetchall()
    db.close()
    return [row["category"] for row in rows]


@router.get("/{job_id}")
def get_job(job_id: int):
    """Get a single job by ID."""
    db = get_db()
    row = db.execute(
        """SELECT j.*, u.name as employer_name, u.company as employer_company,
                  (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
           FROM jobs j
           LEFT JOIN users u ON j.employer_id = u.id
           WHERE j.id = ?""",
        (job_id,)
    ).fetchone()
    db.close()

    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    return dict_from_row(row)


@router.post("")
def create_job(data: JobCreate, current_user: dict = Depends(require_employer)):
    """Create a new job listing (employer only)."""
    db = get_db()
    cursor = db.execute(
        """INSERT INTO jobs (title, description, company, location, location_type,
                            salary_min, salary_max, currency, job_type, category,
                            requirements, benefits, status, employer_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.title, data.description, data.company or current_user.get("company", ""),
         data.location, data.location_type, data.salary_min, data.salary_max,
         data.currency, data.job_type, data.category, data.requirements,
         data.benefits, data.status, current_user["id"])
    )
    db.commit()
    job_id = cursor.lastrowid

    row = db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    db.close()

    return dict_from_row(row)


@router.put("/{job_id}")
def update_job(job_id: int, data: JobUpdate, current_user: dict = Depends(require_employer)):
    """Update an existing job listing (employer owner only)."""
    db = get_db()

    # Check ownership
    job = db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if not job:
        db.close()
        raise HTTPException(status_code=404, detail="Job not found")
    if dict(job)["employer_id"] != current_user["id"]:
        db.close()
        raise HTTPException(status_code=403, detail="You can only edit your own jobs")

    # Build dynamic update
    updates = []
    params = []
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            updates.append(f"{field} = ?")
            params.append(value)

    if not updates:
        db.close()
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = datetime('now')")
    params.append(job_id)

    query = f"UPDATE jobs SET {', '.join(updates)} WHERE id = ?"
    db.execute(query, params)
    db.commit()

    row = db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    db.close()

    return dict_from_row(row)


@router.patch("/{job_id}/status")
def update_job_status(job_id: int, data: JobStatusUpdate, current_user: dict = Depends(require_employer)):
    """Open or close a job listing (employer owner only)."""
    if data.status not in ("open", "closed"):
        raise HTTPException(status_code=400, detail="Status must be 'open' or 'closed'")

    db = get_db()
    job = db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if not job:
        db.close()
        raise HTTPException(status_code=404, detail="Job not found")
    if dict(job)["employer_id"] != current_user["id"]:
        db.close()
        raise HTTPException(status_code=403, detail="You can only modify your own jobs")

    db.execute(
        "UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?",
        (data.status, job_id)
    )
    db.commit()

    row = db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    db.close()

    return dict_from_row(row)

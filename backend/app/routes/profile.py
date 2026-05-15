from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import Response
from ..schemas import ProfileUpdate
from ..auth import get_current_user, require_candidate
from ..database import get_db, dict_from_row

router = APIRouter(prefix="/api/profile", tags=["Profile"])

ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("")
def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    user = current_user.copy()
    db = get_db()
    row = db.execute(
        "SELECT resume_filename, resume_mimetype FROM users WHERE id = ?",
        (current_user["id"],)
    ).fetchone()
    db.close()
    if row:
        rd = dict(row)
        user["has_resume"] = bool(rd.get("resume_filename"))
        user["resume_filename"] = rd.get("resume_filename", "")
    else:
        user["has_resume"] = False
        user["resume_filename"] = ""
    return user


@router.put("")
def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update the current user's profile."""
    db = get_db()
    updates = []
    params = []
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            updates.append(f"{field} = ?")
            params.append(value)
    if not updates:
        db.close()
        raise HTTPException(status_code=400, detail="No fields to update")
    updates.append("updated_at = datetime('now')")
    params.append(current_user["id"])
    db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
    db.commit()
    row = db.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],)).fetchone()
    db.close()
    user = dict_from_row(row)
    user.pop("password_hash", None)
    user.pop("resume_data", None)
    return user


@router.post("/resume")
async def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(require_candidate)):
    """Upload a resume (PDF/DOCX, max 5MB)."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
    db = get_db()
    db.execute(
        "UPDATE users SET resume_data=?, resume_filename=?, resume_mimetype=?, updated_at=datetime('now') WHERE id=?",
        (content, file.filename, file.content_type, current_user["id"])
    )
    db.commit()
    db.close()
    return {"message": "Resume uploaded successfully", "filename": file.filename, "size": len(content)}


@router.get("/resume/{user_id}")
def download_resume(user_id: int, current_user: dict = Depends(get_current_user)):
    """Download a user's resume."""
    db = get_db()
    row = db.execute("SELECT resume_data, resume_filename, resume_mimetype FROM users WHERE id=?", (user_id,)).fetchone()
    db.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    rd = dict(row)
    if not rd.get("resume_data"):
        raise HTTPException(status_code=404, detail="No resume uploaded")
    return Response(
        content=rd["resume_data"],
        media_type=rd["resume_mimetype"],
        headers={"Content-Disposition": f'attachment; filename="{rd["resume_filename"]}"'}
    )


@router.delete("/resume")
def delete_resume(current_user: dict = Depends(require_candidate)):
    """Delete the current user's resume."""
    db = get_db()
    db.execute(
        "UPDATE users SET resume_data=NULL, resume_filename='', resume_mimetype='', updated_at=datetime('now') WHERE id=?",
        (current_user["id"],)
    )
    db.commit()
    db.close()
    return {"message": "Resume deleted successfully"}

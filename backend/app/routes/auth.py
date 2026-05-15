from fastapi import APIRouter, HTTPException
from ..schemas import RegisterRequest, LoginRequest, TokenResponse
from ..auth import hash_password, verify_password, create_access_token, get_current_user
from ..database import get_db, dict_from_row
from fastapi import Depends

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
def register(data: RegisterRequest):
    """Register a new user (candidate or employer)."""
    if data.role not in ("candidate", "employer"):
        raise HTTPException(status_code=400, detail="Role must be 'candidate' or 'employer'")
    if len(data.password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Password too long. Maximum 72 characters.")
    
    db = get_db()
    # Check if email already exists
    existing = db.execute("SELECT id FROM users WHERE email = ?", (data.email,)).fetchone()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(data.password)
    cursor = db.execute(
        """INSERT INTO users (name, email, password_hash, role, company)
           VALUES (?, ?, ?, ?, ?)""",
        (data.name, data.email, hashed, data.role, data.company or "")
    )
    db.commit()
    user_id = cursor.lastrowid

    # Fetch created user
    user_row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()

    user = dict_from_row(user_row)
    user.pop("password_hash", None)
    user.pop("resume_data", None)

    # Create token
    token = create_access_token({"sub": str(user_id), "role": data.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login")
def login(data: LoginRequest):
    """Login and receive JWT token."""
    db = get_db()
    row = db.execute("SELECT * FROM users WHERE email = ?", (data.email,)).fetchone()
    db.close()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = dict_from_row(row)
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["id"]), "role": user["role"]})

    user.pop("password_hash", None)
    user.pop("resume_data", None)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user

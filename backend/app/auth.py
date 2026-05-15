from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS
from .database import get_db, dict_from_row

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto",bcrypt__rounds=12, truncate_error=False)
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    if len(password.encode('utf-8')) > 72:
        raise ValueError("Password cannot be longer than 72 characters")
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extract and validate the current user from JWT token."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_db()
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()

    if row is None:
        raise credentials_exception

    user = dict_from_row(row)
    # Don't send password hash or resume binary to client
    user.pop("password_hash", None)
    user.pop("resume_data", None)
    return user


def require_employer(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the current user is an employer."""
    if current_user["role"] != "employer":
        raise HTTPException(status_code=403, detail="Employer access required")
    return current_user


def require_candidate(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency that ensures the current user is a candidate."""
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Candidate access required")
    return current_user

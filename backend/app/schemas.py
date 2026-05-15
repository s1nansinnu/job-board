from pydantic import BaseModel, EmailStr
from typing import Optional


# ─── Auth Schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # 'candidate' or 'employer'
    company: Optional[str] = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ─── Job Schemas ───────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    description: str
    company: str
    location: str
    location_type: Optional[str] = "onsite"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = "USD"
    job_type: Optional[str] = "full_time"
    category: str
    requirements: Optional[str] = ""
    benefits: Optional[str] = ""
    status: Optional[str] = "open"


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    location_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    job_type: Optional[str] = None
    category: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    status: Optional[str] = None


class JobStatusUpdate(BaseModel):
    status: str  # 'open' or 'closed'


# ─── Application Schemas ──────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = ""


class ApplicationStatusUpdate(BaseModel):
    status: str  # 'applied', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'
    note: Optional[str] = ""


# ─── Profile Schemas ──────────────────────────────────────────

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    company: Optional[str] = None

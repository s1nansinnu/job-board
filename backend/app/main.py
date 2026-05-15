from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import FRONTEND_URL
from .database import init_db
from .routes import auth, jobs, applications, profile

app = FastAPI(
    title="JobBoard API",
    description="Job Board & Application Tracking Platform API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(profile.router)


@app.on_event("startup")
def startup():
    """Initialize database on startup."""
    init_db()


@app.get("/")
def root():
    return {"message": "JobBoard API is running", "docs": "/docs"}


@app.get("/api/stats")
def get_stats():
    """Get platform statistics for the landing page."""
    from .database import get_db
    db = get_db()
    jobs_count = db.execute("SELECT COUNT(*) as c FROM jobs WHERE status='open'").fetchone()["c"]
    candidates_count = db.execute("SELECT COUNT(*) as c FROM users WHERE role='candidate'").fetchone()["c"]
    employers_count = db.execute("SELECT COUNT(*) as c FROM users WHERE role='employer'").fetchone()["c"]
    applications_count = db.execute("SELECT COUNT(*) as c FROM applications").fetchone()["c"]
    db.close()
    return {
        "open_jobs": jobs_count,
        "candidates": candidates_count,
        "employers": employers_count,
        "applications": applications_count,
    }

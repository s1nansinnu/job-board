import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "jobboard.db")


def get_db():
    """Get a database connection with row_factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def dict_from_row(row):
    """Convert a sqlite3.Row to a regular dict."""
    if row is None:
        return None
    return dict(row)


def dicts_from_rows(rows):
    """Convert a list of sqlite3.Row to list of dicts."""
    return [dict(row) for row in rows]


def init_db():
    """Create all tables if they don't exist."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('candidate', 'employer')),
            phone TEXT DEFAULT '',
            location TEXT DEFAULT '',
            bio TEXT DEFAULT '',
            resume_data BLOB,
            resume_filename TEXT DEFAULT '',
            resume_mimetype TEXT DEFAULT '',
            skills TEXT DEFAULT '',
            company TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            location_type TEXT DEFAULT 'onsite' CHECK(location_type IN ('onsite', 'remote', 'hybrid')),
            salary_min INTEGER,
            salary_max INTEGER,
            currency TEXT DEFAULT 'USD',
            job_type TEXT DEFAULT 'full_time' CHECK(job_type IN ('full_time', 'part_time', 'contract', 'internship')),
            category TEXT NOT NULL,
            requirements TEXT DEFAULT '',
            benefits TEXT DEFAULT '',
            status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'draft')),
            employer_id INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (employer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT DEFAULT 'applied' CHECK(status IN ('applied', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn')),
            cover_letter TEXT DEFAULT '',
            candidate_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (candidate_id) REFERENCES users(id),
            FOREIGN KEY (job_id) REFERENCES jobs(id),
            UNIQUE(candidate_id, job_id)
        );

        CREATE TABLE IF NOT EXISTS status_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_status TEXT NOT NULL,
            to_status TEXT NOT NULL,
            note TEXT DEFAULT '',
            application_id INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (application_id) REFERENCES applications(id)
        );
    """)
    conn.close()
    print(f"Database initialized at {DB_PATH}")

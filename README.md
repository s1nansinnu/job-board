# JobBoard — Job Board & Application Tracking Platform

A full-stack web application where employers can post job listings, candidates can browse and apply, and both can track application statuses with email notifications.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 (Create React App) |
| **Styling** | CSS Modules + CSS Custom Properties |
| **Backend** | FastAPI (Python) |
| **Database** | SQLite (Python built-in `sqlite3`) |
| **Auth** | JWT (python-jose + passlib) |
| **Email** | fastapi-mail |

## ✨ Features

### For Candidates
- 📝 Register and manage profile
- 📄 Upload/download resume (PDF/DOCX)
- 🔍 Browse, search, and filter job listings
- 📨 Apply for jobs with cover letter
- 📊 Track application status (Applied → Reviewing → Shortlisted → Interview → Offered)
- 📧 Email notifications on status updates

### For Employers
- 📋 Create, edit, and close job listings
- 👥 View and manage applications
- 📄 Download candidate resumes
- 🔄 Update application status (triggers email notification)
- 📊 Dashboard with stats and insights

### Platform
- 🔐 JWT authentication with role-based access
- 🎨 Premium dark theme with glassmorphism
- 📱 Fully responsive design
- 🔎 Search and filter by role, location, salary, job type

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend will start at `http://localhost:8000`. API docs available at `/docs`.

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will start at `http://localhost:3000`.

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000

# SMTP (optional, for email notifications)
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_FROM=noreply@jobboard.com
MAIL_SERVER=smtp.mailtrap.io
MAIL_PORT=587
```

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login (returns JWT) |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/jobs` | — | List/search/filter jobs |
| GET | `/api/jobs/:id` | — | Job detail |
| POST | `/api/jobs` | Employer | Create job |
| PUT | `/api/jobs/:id` | Employer | Update job |
| PATCH | `/api/jobs/:id/status` | Employer | Open/close job |
| POST | `/api/applications` | Candidate | Apply for job |
| GET | `/api/applications` | JWT | List applications |
| PATCH | `/api/applications/:id/status` | Employer | Update status |
| GET/PUT | `/api/profile` | JWT | Manage profile |
| POST | `/api/profile/resume` | Candidate | Upload resume |

## 🎨 Design

- Dark theme with CSS custom properties
- Glassmorphism cards with backdrop blur
- Gradient accents (Indigo → Violet)
- Micro-animations and hover effects
- Responsive mobile-first layout
- Inter font family

## 📂 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry
│   │   ├── config.py        # Settings
│   │   ├── database.py      # SQLite setup
│   │   ├── auth.py          # JWT auth
│   │   ├── schemas.py       # Pydantic models
│   │   ├── email.py         # Notifications
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── jobs.py
│   │       ├── applications.py
│   │       └── profile.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── context/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
└── README.md
```

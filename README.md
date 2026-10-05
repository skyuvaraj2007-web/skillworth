# SKILLWORTH — Recognition of Prior Learning & Skill Verification Platform

SkillWorth is an AI-assisted Recognition of Prior Learning (RPL) and competency-verification platform compliant with ISO/IEC 17024 benchmarks.

---

## Core Workflow

```text
Learner
   ↓
Select Skill & Competency
   ↓
Submit Practical Evidence (Documents, Code, Video Demonstration)
   ↓
AI-Assisted Preliminary Analysis
   ↓
Protocol Assessment & Practical Task
   ↓
Authorized Assessor Final Evaluation (APPROVE / REQUEST MORE EVIDENCE / REJECT)
   ↓
SkillWorth Credential (SW-XXXXXX)
   ↓
Industry / Employer Verification
```

---

## Project Structure

```text
SkillWorth/
│
├── app.py                     # Master development launcher
│
├── backend/
│   ├── src/
│   │   ├── routes/            # Standalone API routes (auth, evidence, assessments, assessor, credentials)
│   │   ├── db/                # SkillWorth standalone database engine (skillworthDatabase.js)
│   │   ├── config/            # Server configuration
│   │   └── server.js          # Express backend application
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Stitch UI components
│   │   ├── pages/             # Role portals (Learner, Institution, Assessor, Industry)
│   │   ├── locales/           # Multi-language translations (en.json, ta.json, hi.json)
│   │   └── services/          # skillworthApi client
│   └── package.json
│
├── data/
│   └── skillworth_db.json     # Dedicated standalone database
│
├── uploads/                   # Local storage for evidence and video demonstrations
├── .env                       # SkillWorth environment configuration
├── .env.example
├── requirements.txt
└── README.md
```

---

## Getting Started

Start the complete application (backend + frontend dev server + database) with a single command:

```bash
python app.py
```

* **Frontend Application**: `http://localhost:5173`
* **Registration Page**: `http://localhost:5173/register`
* **Backend API Health**: `http://localhost:5000/api/health`

### Quick Demo Credentials:
* **Learner / Student**: `learner.demo@skillworth.org` / `SkillWorth@2026`
* **Assessor**: `assessor.demo@skillworth.org` / `SkillWorth@2026`
* **Institution**: `assessor.demo@skillworth.org` / `SkillWorth@2026`
* **Industry / Company**: `industry.demo@skillworth.org` / `SkillWorth@2026`
* **Sample Credential ID**: `SW-884201`

---

## Testing

Run the automated standalone test suite:

```bash
node scripts/test_skillworth_standalone.js
```

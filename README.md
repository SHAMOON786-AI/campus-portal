# 🎓 AI-Powered Campus Placement & Internship Management Portal

A full-stack, end-to-end enterprise platform designed to manage university recruitment drives, candidate application pipelines, real-time status timelines, and interview scheduling. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---
The link for the website is :  https://campus-portal-omega.vercel.app 

## ✨ Key Features

### 🚀 For Students (`/dashboard`)
* **AI Match Engine**: Displays optimal profile matching percentages for active university placement drives.
* **Resume Management**: Seamless PDF/Docx resume upload storing securely in Supabase buckets.
* **Live Application Timeline**: Real-time status tracking across stages (*Applied → AI Screening → Recruiter Review → Shortlisted / Interview / Hired*).
* **Automated Notices**: Instant alerts if a recruiter withdraws or deletes a campus drive.
* **Offer & Compensation Disclosure**: Secure viewing of finalized stipends and CTC packages upon hiring.

### 💼 For Recruiters (`/recruiter`)
* **Drive Publishing**: Create comprehensive job listings with role specifications, CGPA cutoffs, and location autocomplete matching major Indian IT hubs, state capitals, and global tech centers.
* **Applicant Evaluation Pipeline**: Review candidate profiles, download resumes instantly, and update pipeline statuses.
* **Interview Scheduling**: Integrated date-time picker (restricted to future dates with 24-hour clock formatting) to schedule candidate interviews.
* **Compensation Assignment**: Direct input fields to assign and save official stipends or CTC packages.
* **Drive Management**: Ability to delete or withdraw active job openings with automatic student notification sync.

---

## 🛠️ Tech Stack
* **Frontend**: Next.js (React Server & Client Components), Tailwind CSS, Lucide Icons.
* **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Auth, and Storage).
* **Language**: TypeScript.

---

## ⚙️ Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/SHAMOON786-AI/campus-portal.git](https://github.com/SHAMOON786-AI/campus-portal.git)
   cd campus-portal
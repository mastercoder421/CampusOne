# CampusOne | Smart Campus Operating System

A production-grade, full-stack Smart Campus Web Application built with the **MERN** stack (MongoDB Atlas, Express.js, React 18, Node.js), styled with **Tailwind CSS**, and integrated with **Google Gemini AI (CampusBot)**.

---

## 🏛️ System Architecture

```
CampusOne/
├── .gitignore
├── package.json
├── backend/
│   ├── .env
│   ├── package.json
│   ├── server.js
│   ├── seed.js
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── AttendanceSession.js
│   │   ├── AttendanceRecord.js
│   │   ├── Assignment.js
│   │   ├── CampusEvent.js
│   │   ├── Complaint.js
│   │   ├── LostAndFound.js
│   │   └── RoomBooking.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   ├── assignmentController.js
│   │   ├── eventController.js
│   │   ├── complaintController.js
│   │   ├── lostFoundController.js
│   │   ├── roomController.js
│   │   └── aiController.js
│   └── routes/
│       ├── authRoutes.js
│       ├── attendanceRoutes.js
│       ├── assignmentRoutes.js
│       ├── eventRoutes.js
│       ├── complaintRoutes.js
│       ├── lostFoundRoutes.js
│       ├── roomRoutes.js
│       └── aiRoutes.js
└── frontend/
    ├── .env
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── axiosClient.js
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── AttendanceFaculty.jsx
            ├── AttendanceStudent.jsx
            ├── Assignments.jsx
            ├── Events.jsx
            ├── Grievances.jsx
            ├── LostFound.jsx
            ├── RoomBooking.jsx
            └── CampusAiChat.jsx
```

---

## 🔑 Demo Login Credentials

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Admin** | System Administrator | `admin@campusone.edu` | `Admin@123` | Institutional oversight, room approvals, grievance redressal |
| **Faculty** | Dr. Alan Turing | `faculty@campusone.edu` | `Faculty@123` | CS Faculty; manages CS301 & CS302, attendance roll calls, grading |
| **Student** | Vijay Sharma | `student@campusone.edu` | `Student@123` | 100% Attendance (Safe ≥ 75% Badge); Roll: 24CS101 |
| **Student** | Rahul Verma | `rahul@campusone.edu` | `Student@123` | 38% Attendance (Critical < 75% Red Alert); Roll: 24CS102 |
| **Student** | Priya Singh | `priya@campusone.edu` | `Student@123` | 100% Attendance (Safe ≥ 75% Badge); Roll: 24CS103 |

> **Tip:** The Login page includes one-click demo login buttons to instantly pre-fill and switch accounts!

---

## 🚀 How to Run Locally

### 1. Database Seeding (Already Done)
To re-seed the MongoDB cluster anytime:
```bash
npm run seed
# or
node backend/seed.js
```

### 2. Start the Backend API (Port 5000)
```bash
cd backend
npm run dev
# or from root
npm run dev:backend
```

### 3. Start the Frontend Application (Port 5173)
```bash
cd frontend
npm run dev
# or from root
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🛡️ Core Modules & Features

1. **Role-Based Access Control (RBAC):** Strict JWT verification (`verifyToken`) and permissions gatekeeping (`checkRole`).
2. **Attendance Management:**
   - **Faculty:** Course selector, session date selector, student roster table with inline radio pills (`[Present]`, `[Absent]`, `[Late]`), a single-click `"Mark All Present"` helper, and batch upsert persistence via MongoDB `bulkWrite`.
   - **Student:** Progress percentage cards per subject, dynamic color badges (Green for ≥75%, Red warning badge for <75%), total class counters, and interactive session history timeline.
3. **Course Assignments:**
   - Faculty upload modal with title, description, deadline, and course picker.
   - Student submission drawer supporting repository URLs or solutions with status badges (`Pending`, `Submitted`, `Graded`).
   - Faculty grading modal with letter grade picker and personalized feedback notes.
4. **Campus Life & Club Events:**
   - Interactive cards with date, venue, club name, and interactive RSVP toggle button with dynamic counter.
5. **Grievance Redressal Board:**
   - Ticket filing form with category pills (`Hostel`, `Academic`, `Mess`, `Maintenance`).
   - Visual status timeline tracking: `Pending` ➔ `In Progress` ➔ `Resolved`.
   - Administrative review and resolution notes attachment.
6. **Lost & Found Bulletin:**
   - Active notices for lost and found articles with location and contact information.
   - Self-service or administrative resolve toggle.
7. **Facility & Room Booking:**
   - Real-time reservations schedule for seminar halls, conference suites, and computing labs.
   - Administrative approval and conflict prevention.
8. **CampusBot AI Assistant:**
   - Powered by Google Gemini (`gemini-1.5-flash`) with institutional system prompt, suggestion chips, and automated fallback.

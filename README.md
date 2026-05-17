# In-House Goal Setting & Tracking Portal

A web-based portal for the full lifecycle of employee goal management:
creation, approval, quarterly check-ins, and performance reporting.

---

## Live Demo

**URL:** [[Live Demo](https://goal-setting-portal-7qo3qc1bt-devisri36s-projects.vercel.app/)]

### Demo Credentials

| Role     | Username        | Password   |
|----------|-----------------|------------|
| Employee | employee@demo   | demo1234   |
| Manager  | manager@demo    | demo1234   |
| Admin    | admin@demo      | demo1234   |

> Or use the **Role Switcher** on the landing page to instantly switch between roles.

---

## Features

### Phase 1 — Goal Creation & Approval
- Employee goal sheet: Thrust Area, Goal Title, UoM, Target, Weightage
- Validation: 100% total weightage, min 10% per goal, max 8 goals
- Manager (L1) approval with inline editing; goals lock on approval
- Shared Goals: Admin/Manager pushes KPIs to multiple employees

### Phase 2 — Achievement Tracking & Quarterly Check-ins
- Quarterly update interface: log Actual vs. Planned
- Status per goal: Not Started / On Track / Completed
- Manager check-in module with structured comments
- Auto-computed progress scores:
  - Min (higher is better): Achievement ÷ Target
  - Max (lower is better): Target ÷ Achievement
  - Timeline: Completion date vs. Deadline
  - Zero: If 0 → 100%, else 0%

### Check-in Schedule
| Period          | Window     |
|-----------------|------------|
| Goal Setting    | May        |
| Q1 Check-in     | July       |
| Q2 Check-in     | October    |
| Q3 Check-in     | January    |
| Q4 / Annual     | March/April|

### Reporting & Governance
- CSV export: Planned vs. Actual for all employees
- Completion Dashboard: real-time check-in status
- Audit Trail: logs every change after goal lock (who, what, when)

### Bonus — Analytics Module
- Quarter-on-Quarter achievement trends
- Heatmaps and progress charts
- Goal distribution by Thrust Area and UoM
- Manager effectiveness dashboard

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React, TypeScript, Tailwind CSS   |
| Backend    | Motoko (Internet Computer)        |
| Storage    | Canister state (on-chain)         |
| Hosting    | Internet Computer (ICP)           |
| Auth       | Role-based session (demo switcher)|
| Charts     | Recharts                          |

---

## Architecture

See `architecture-diagram.png` in this repository.

---


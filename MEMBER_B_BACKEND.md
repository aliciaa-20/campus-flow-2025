# 🟩 Member B — Backend Guide
### Your job: Supabase setup, API routes, GitHub repo, middleware
> You are the backbone of the team. The database, auth protection, and task saving logic all belong to you.

---

## ⏱ Your Timeline
| Time | What you do |
|---|---|
| 0:00 – 0:20 | Create GitHub repo + push code + setup Supabase + share .env |
| 0:20 – 0:55 | Run the schema SQL, verify tables, test API routes |
| 0:55 – 1:30 | Wire and test POST /api/tasks end to end |
| 1:30 – 2:00 | Wire and test POST /api/notice end to end |
| 2:00 – 2:30 | Seed demo data, verify dashboard shows tasks |
| 2:30 – 3:00 | Test full flow, fix any bugs, help with pitch |

---

## STEP 1 — Create the GitHub repo and push (0:00 to 0:10)

### 1.1 Download the project zip
Download `campusflow.zip` from wherever it was shared. Extract it.

### 1.2 Open terminal inside the folder
```bash
cd campusflow
```

### 1.3 Initialize git and push
```bash
git init
git add .
git commit -m "feat: CampusFlow initial commit"
```

Now go to `github.com/new`:
- Repo name: `campusflow`
- Visibility: Public (so all team members can clone)
- Do NOT initialize with README (we already have one)
- Click Create repository

Then run (replace YOUR_USERNAME):
```bash
git remote add origin https://github.com/YOUR_USERNAME/campusflow.git
git branch -M main
git push -u origin main
```

### 1.4 Share repo link with Member A and Member C on WhatsApp/Discord immediately.

---

## STEP 2 — Create Supabase project (0:10 to 0:20)

### 2.1 Sign up and create a project
1. Go to `supabase.com` → Sign Up (use Google for speed)
2. Click "New Project"
3. Fill in:
   - Name: `campusflow`
   - Database password: anything you'll remember (e.g. `CampusFlow2025!`)
   - Region: Southeast Asia (Singapore) — closest to India
4. Click "Create new project"
5. Wait ~1 minute for it to spin up

### 2.2 Get your API keys
1. Go to Project Settings (gear icon on left sidebar) → API
2. Copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.3 Create your .env.local
In your project folder:
```bash
cp .env.example .env.local
```
Open `.env.local` and paste:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
GROQ_API_KEY=              ← Member C will share this
N8N_DEADLINE_WEBHOOK=      ← Member C will share this
N8N_NOTICE_WEBHOOK=        ← Member C will share this
TWILIO_ACCOUNT_SID=        ← Member C will share this
TWILIO_AUTH_TOKEN=         ← Member C will share this
```

**Share this .env.local file with Member A and Member C on WhatsApp (it's private — don't commit it to GitHub).**

---

## STEP 3 — Run the database schema (0:15 to 0:20)

### 3.1 Open Supabase SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### 3.2 Run the schema
Copy the entire contents of `supabase/schema.sql` from the repo and paste it into the SQL editor. Click "Run".

You should see: `Success. No rows returned`

### 3.3 Verify tables were created
Click "Table Editor" in the left sidebar. You should see:
- `students` table
- `tasks` table

Both should have the columns listed below:

**students table:**
| Column | Type |
|---|---|
| id | uuid |
| user_id | uuid |
| name | text |
| branch | text |
| year | int4 |
| phone | text |
| created_at | timestamptz |

**tasks table:**
| Column | Type |
|---|---|
| id | uuid |
| student_id | uuid |
| title | text |
| subject | text |
| deadline | timestamptz |
| reminder_time | timestamptz |
| add_to_calendar | bool |
| created_at | timestamptz |

---

## STEP 4 — Enable Supabase Email Auth

1. Go to your Supabase project → Authentication (left sidebar)
2. Click "Providers"
3. Make sure "Email" is enabled (it is by default)
4. Scroll down → turn OFF "Confirm email" (so users don't need to verify during demo)

This means any email/password will work immediately without a confirmation step.

---

## STEP 5 — Install and run locally (0:20)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`
- Should redirect to `/login`
- Try signing up with any email + password
- If you land on `/dashboard` → auth is working ✅

---

## STEP 6 — Understanding the API routes you own

All API routes are in `app/api/`. Here's what each does in plain English:

### `app/api/tasks/route.ts`
This runs when Member A's form is submitted. It does 3 things:
1. Takes the form data (title, subject, deadline, phone, studentId, studentName)
2. Saves the task to Supabase `tasks` table
3. Sends the task info to n8n via a POST request (n8n then sends WhatsApp + creates Calendar event)

**To test manually** (after Member C gives you the webhook URL):
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ER Diagram",
    "subject": "DBMS",
    "deadline": "2025-07-01T10:00:00.000Z",
    "phone": "9876543210",
    "studentId": "YOUR_STUDENT_UUID",
    "studentName": "Aarush"
  }'
```
Expected response:
```json
{ "task": { "id": "...", "title": "ER Diagram", ... } }
```

---

### `app/api/notice/route.ts`
This runs when the Notice page form is submitted. It does 3 things:
1. Sends the notice text to Groq AI to get a 3-bullet summary
2. Fires the n8n Workflow 2 webhook with the summary + phone list
3. Returns the summary to the frontend to display

**To test manually:**
```bash
curl -X POST http://localhost:3000/api/notice \
  -H "Content-Type: application/json" \
  -d '{
    "noticeText": "The mid-semester examination for all B.Tech students will be held from 15th July to 20th July 2025. Students must carry their ID cards. Hall tickets will be distributed on 13th July.",
    "eventTitle": "Mid-Semester Exams",
    "eventDate": "2025-07-15T09:00:00.000Z",
    "phoneList": ["9876543210"]
  }'
```
Expected response:
```json
{ "summary": "• Mid-semester exams from July 15–20\n• ID cards mandatory...\n• Hall tickets on July 13" }
```

---

### `app/api/ai/flashcards/route.ts` and `app/api/ai/mcq/route.ts`
These belong to Member C's AI work but live in your API folder. You don't need to touch them — just make sure the files exist in the repo.

---

## STEP 7 — Seed demo data before the demo (do this in Phase 5)

### 7.1 Get your user UUID
1. Register an account on the app (via the login page)
2. Go to Supabase → Authentication → Users
3. Find your email → copy the UUID (looks like `a1b2c3d4-...`)

### 7.2 Run the seed SQL
1. Go to Supabase → SQL Editor → New query
2. Open `supabase/seed.sql` from the repo
3. Replace `YOUR_USER_ID` with the UUID you just copied
4. Click Run

You should see: `NOTICE: Seed complete. Student ID: ...`

### 7.3 Verify it worked
1. Go to Supabase → Table Editor → `tasks` table
2. You should see 4 rows (DBMS, OS, CN, ML assignments)
3. Go to your app dashboard → refresh → 4 tasks should appear ✅

---

## STEP 8 — Common issues and fixes

| Problem | Fix |
|---|---|
| `relation "students" does not exist` | Run `supabase/schema.sql` again |
| API returns 401 | `.env.local` is missing or keys are wrong |
| Task saves but n8n doesn't fire | Check `N8N_DEADLINE_WEBHOOK` is set in `.env.local` |
| Dashboard shows no tasks after seeding | Check RLS — make sure you're logged in with the seeded user |
| `invalid input syntax for type uuid` | The studentId being passed is undefined — check the form is sending it |
| Supabase anon key error | Double check you copied the `anon public` key, NOT the `service_role` key |

---

## STEP 9 — Your demo role

You control the Supabase dashboard on a second tab during the demo.

When the judge asks "where is the data stored?":
1. Open Supabase → Table Editor → `tasks`
2. Show the row that was just inserted live
3. Point out the `deadline` and `reminder_time` columns

This is a strong visual for judges who care about the backend.

---

## Quick reference — commands you'll use

```bash
npm run dev          ← start the app
git add . && git commit -m "fix: ..." && git push    ← push changes
```

Supabase shortcuts:
- SQL Editor → run raw SQL
- Table Editor → view/edit data like a spreadsheet
- Authentication → see registered users and their UUIDs

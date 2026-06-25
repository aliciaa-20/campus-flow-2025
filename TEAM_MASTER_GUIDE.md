# 📋 CampusFlow — Team Master Guide
### 3 members | 3 hours | One demo that wins

---

## Who does what — zero overlap

| | Member A | Member B | Member C |
|---|---|---|---|
| **Role** | Frontend | Backend | AI + Automation |
| **Owns** | All pages + UI + dark mode | Supabase + API routes + GitHub | Groq + n8n + Twilio |
| **Read** | `MEMBER_A_FRONTEND.md` | `MEMBER_B_BACKEND.md` | `MEMBER_C_AI_AUTOMATION.md` |
| **Never touches** | API routes, Supabase SQL | UI files, n8n | Pages, Supabase tables |

---

## Phase-by-phase sync plan

### 🕐 0:00 — All start simultaneously
- **A** → runs `create-next-app` and installs packages
- **B** → creates GitHub repo and pushes code, creates Supabase project
- **C** → gets Groq key, joins Twilio sandbox, creates n8n account

### 🕐 0:10 — B shares with everyone
Member B shares on WhatsApp/Discord:
```
GitHub: https://github.com/YOUR/campusflow
Supabase URL: https://xxxx.supabase.co
Supabase Anon Key: eyJ...
```

### 🕐 0:20 — C shares with B
Member C shares:
```
Groq Key: gsk_...
Twilio SID: AC...
Twilio Token: ...
N8N Workflow 1 URL: https://....n8n.cloud/webhook-test/deadline-reminder
N8N Workflow 2 URL: https://....n8n.cloud/webhook-test/notice-summarizer
```
Member B puts everything in `.env.local` and reshares the complete file.

### 🕐 0:20 — Everyone clones and runs
A and C clone the repo:
```bash
git clone https://github.com/YOUR/campusflow.git
cd campusflow
npm install
```
Paste the complete `.env.local` that B shared. Run `npm run dev`.

### 🕐 1:30 — Sync checkpoint
All three test the core flow together:
1. A opens the app → signs up
2. A goes to Add Task → fills form → submits
3. C confirms: WhatsApp received + Calendar event created
4. B confirms: task row visible in Supabase Table Editor

If any step fails → fix it together before moving on.

### 🕐 2:30 — Final sync
- B runs the seed SQL (demo data)
- A does mobile + dark mode check
- C switches n8n from Test URLs to Production URLs
- All three do one full dry run of the demo script

---

## The demo script (practice this)

**Total time: 2 minutes**

| # | Who | Action | What judges see |
|---|---|---|---|
| 1 | A | Open app, sign in with demo account | Login page → dashboard with 4 tasks |
| 2 | A | Click Add Task → fill form → submit | Form submits |
| 3 | C | Hold phone to camera | WhatsApp arrives within 30 sec |
| 4 | B | Open Google Calendar on second screen | New event visible |
| 5 | A | Go to Study Buddy → paste notes → Generate Flashcards | Cards appear, click to flip |
| 6 | A | Go to Notice → paste notice → Summarise | 3-bullet summary appears |
| 7 | C | Show n8n dashboard | Green execution logs |
| 8 | B | Show Supabase table | Live task data |

---

## Emergency fallbacks (if something breaks during demo)

| What breaks | Fallback |
|---|---|
| WhatsApp doesn't arrive | Show the n8n execution log — it proves the workflow ran |
| n8n webhook times out | Show the test execution from 15 min earlier |
| Groq flashcards fail | Have a screenshot of a successful run ready |
| App crashes | Have Vercel preview URL as backup (deploy before demo) |
| Supabase down | Show the seeded data screenshot |

---

## Git workflow during the hackathon

Only Member B pushes to main. A and C work on branches:

```bash
# Member A
git checkout -b frontend
# ... make changes ...
git add . && git commit -m "feat: dashboard UI"
git push origin frontend

# Member B merges to main
git checkout main
git merge frontend
git push origin main

# Everyone pulls
git pull origin main
```

If you get a merge conflict → call Member B. Don't try to resolve it yourself.

---

## .env.local — complete file (Member B fills this and shares)

```env
# Supabase (Member B)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Groq AI (Member C)
GROQ_API_KEY=

# n8n Webhooks (Member C)
N8N_DEADLINE_WEBHOOK=
N8N_NOTICE_WEBHOOK=

# Twilio (Member C)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

**This file must NEVER be pushed to GitHub. It is already in `.gitignore`.**

---

## Scoring reminder — what wins points

| Points | Feature | Owner |
|---|---|---|
| 20 | Login + dashboard + task CRUD | A + B |
| 15 | WhatsApp reminder fires | C |
| +5 | 1-hour nudge too | C |
| 15 | Google Calendar event created | C |
| +5 | Attendees added to event | C |
| 20 | AI Study Buddy | A + C |
| +5 | AI accuracy/formatting | C |
| 15 | Notice Summarizer | A + C |
| 10 | UI/UX + mobile | A |
| +5 | Dark mode | A |
| 10 | Live demo + pitch | Everyone |
| +5 | WhatsApp shown live on phone | C |

**Target: 95–115 points**

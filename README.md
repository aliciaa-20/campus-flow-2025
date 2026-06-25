# CampusFlow 🎓
> Smart student deadline & study manager — built at CampusAI 2025 Hackathon

## What it does
- 📅 Add deadlines → Google Calendar event created automatically
- 📲 WhatsApp reminder fires 24 hours before every deadline
- 🧠 Paste lecture notes → AI generates Flashcards + MCQ Quiz
- 📣 Paste a college notice → AI 3-bullet summary + WhatsApp broadcast to study group

## Tech stack
| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + ShadcnUI |
| Auth + DB | Supabase |
| AI | Groq API (llama-3-70b-versatile) |
| Automation | n8n Cloud |
| WhatsApp | Twilio Sandbox |
| Calendar | Google Calendar via n8n |

## Getting started

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/campusflow.git
cd campusflow
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase project settings
- `GROQ_API_KEY` → console.groq.com
- `N8N_DEADLINE_WEBHOOK` → n8n Workflow 1 test URL
- `N8N_NOTICE_WEBHOOK` → n8n Workflow 2 test URL
- `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` → twilio.com/console

### 3. Set up Supabase
Run `supabase/schema.sql` in your Supabase SQL Editor.

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Seed demo data (before demo)
- Register an account, get your user UUID from Supabase Auth → Users
- Replace `YOUR_USER_ID` in `supabase/seed.sql`
- Run it in Supabase SQL Editor

## Team
| Member | Role |
|---|---|
| A | Frontend (pages, UI, dark mode) |
| B | Backend (Supabase, API routes, middleware) |
| C | AI + Automation (Groq, n8n, Twilio) |

## n8n Workflows
- **Workflow 1 — Deadline Reminder:** Webhook → Set → Google Calendar → Wait 24h → Twilio WhatsApp
- **Workflow 2 — Notice Summarizer:** Webhook → Groq HTTP Request → Set → Google Calendar → Loop → Twilio WhatsApp

## Live demo checklist
- [ ] Register with real email + phone
- [ ] Add task → WhatsApp arrives within 30 sec
- [ ] Google Calendar event visible
- [ ] Paste notes → flashcards + quiz appear
- [ ] n8n dashboard shows green execution logs

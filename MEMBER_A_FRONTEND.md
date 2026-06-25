# 🟦 Member A — Frontend Guide
### Your job: Pages, UI, Navigation, Dark Mode
> You own everything the user sees. No backend, no n8n, no Twilio. Just React + Tailwind.

---

## ⏱ Your Timeline
| Time | What you do |
|---|---|
| 0:00 – 0:20 | Setup project, install packages, run dev server |
| 0:20 – 0:55 | Wire login page + dashboard + navbar |
| 0:55 – 1:30 | Build Add Task form page |
| 1:30 – 2:00 | Build Study Buddy page (flashcards + MCQ UI) |
| 2:00 – 2:30 | Build Notice page UI |
| 2:30 – 3:00 | Dark mode toggle + mobile polish + help with pitch |

---

## STEP 1 — Setup (0:00 to 0:20)

### 1.1 Create the project
Open your terminal and run these one by one:

```bash
npx create-next-app@latest campusflow --typescript --tailwind --app
```
When it asks questions, answer:
- Would you like to use ESLint? → Yes
- Would you like to use `src/` directory? → No
- Would you like to customize import alias? → Yes, keep `@/*`

```bash
cd campusflow
```

### 1.2 Install all packages
```bash
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared @supabase/auth-helpers-nextjs next-themes groq-sdk class-variance-authority clsx tailwind-merge tailwindcss-animate lucide-react
```

### 1.3 Get the code from GitHub
> Wait for Member B to push the repo first (takes ~5 min). Then:

```bash
git clone https://github.com/TEAM_REPO/campusflow.git
cd campusflow
npm install
```

### 1.4 Create your local env file
```bash
cp .env.example .env.local
```
Ask Member B to share the filled `.env.local` values on WhatsApp/Discord. Paste them in.

### 1.5 Start the dev server
```bash
npm run dev
```
Open your browser → `http://localhost:3000`

If you see a blank page or redirect to `/login` → ✅ working correctly.

---

## STEP 2 — What files you own

All your files are already in the repo. You don't need to create them from scratch.
Just open them in VS Code and understand what each does:

```
app/
├── login/page.tsx        ← Login screen using Supabase Auth UI
├── dashboard/page.tsx    ← Home screen showing tasks
├── tasks/new/page.tsx    ← Form to add a new deadline
├── study/page.tsx        ← Flashcards + MCQ quiz UI
├── notice/page.tsx       ← Notice summarizer UI
components/
├── Navbar.tsx            ← Top navigation bar
├── theme-provider.tsx    ← Dark/light mode wrapper
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    ├── badge.tsx
    └── textarea.tsx
app/globals.css           ← CSS variables + flip card styles
app/layout.tsx            ← Root layout wrapping all pages
```

---

## STEP 3 — What each page does (plain English)

### `app/login/page.tsx`
- Shows the CampusFlow logo + tagline
- Renders the Supabase Auth UI (email + password form)
- When user signs in → automatically redirects to `/dashboard`
- You don't write any login logic — Supabase handles it all

**Test it:** Go to `localhost:3000/login` → you should see a sign in form

---

### `app/dashboard/page.tsx`
- Checks if user is logged in (if not → redirects to login)
- Fetches the student's tasks from Supabase
- Shows a grid of quick action cards (Add Task, Study Buddy, Notice, Attendance)
- Shows a list of upcoming deadlines with a color badge (Due Today / X days left / Overdue)
- Has a Sign Out button

**Test it:** Sign in → you should land on dashboard. If no tasks yet, you'll see "No deadlines yet" message.

---

### `app/tasks/new/page.tsx`
- A form with 4 fields: Task Title, Subject, Deadline (date+time picker), Phone Number
- Phone is pre-filled from the student's profile
- On submit → calls `POST /api/tasks` (Member B's code)
- After saving → redirects back to dashboard

**Test it:** Fill the form → click Save → should go back to dashboard and show the new task

---

### `app/study/page.tsx`
- Textarea to paste lecture notes
- Two buttons: "Generate Flashcards" and "Generate MCQ Quiz"
- Flashcards show as a grid — click any card to flip it and see the answer
- MCQ shows questions with 4 options — click an option to see if it's correct (green) or wrong (red)
- Tab switcher to toggle between Flashcards and Quiz

**Test it:** Paste any text → click Generate Flashcards → cards should appear and flip on click

---

### `app/notice/page.tsx`
- Textarea for the full notice text
- Fields for Event Title, Event Date, and a comma-separated list of phone numbers
- On submit → calls `POST /api/notice` (Member C's code)
- Shows the AI 3-bullet summary after it's done
- Shows confirmation that WhatsApp was sent

**Test it:** Paste any notice text → click Summarise → summary should appear below

---

### `components/Navbar.tsx`
- Shows the CampusFlow logo
- Navigation links to all 4 pages
- Dark mode toggle button (moon/sun icon)
- Active page link is highlighted

---

## STEP 4 — Dark Mode (do this in Phase 5)

Dark mode is already wired via `next-themes`. The toggle button in `Navbar.tsx` switches between light and dark.

To verify it works:
1. Click the 🌙 button in the navbar
2. Page should switch to dark theme
3. Click ☀️ to go back to light

If it's not working, check that `ThemeProvider` is wrapping the app in `app/layout.tsx`. It should look like:
```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  {children}
</ThemeProvider>
```

---

## STEP 5 — Mobile check (do this in Phase 5)

Open Chrome DevTools → press `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac) → select iPhone view.

Check these on mobile:
- [ ] Navbar wraps correctly and doesn't overflow
- [ ] Forms are full width and usable
- [ ] Flashcard grid shows 1 column (not 2)
- [ ] Buttons are easy to tap

The layout uses Tailwind's `container mx-auto px-4` so it should be responsive by default.

---

## STEP 6 — Common issues and fixes

| Problem | Fix |
|---|---|
| `Module not found: @/components/ui/button` | Run `npm install` again |
| Page shows blank white screen | Check browser console for errors |
| Dark mode not working | Make sure `theme-provider.tsx` exists in `components/` |
| Login form doesn't appear | Check `NEXT_PUBLIC_SUPABASE_URL` is set in `.env.local` |
| Redirected to login even after signing in | Check `middleware.ts` exists at root level |

---

## STEP 7 — Your demo role

During the live demo, you control the browser/laptop. Practice this flow:

1. Open `localhost:3000` → lands on dashboard (or login)
2. Sign in with the demo account credentials
3. Show the dashboard with seeded tasks (Member B seeds before demo)
4. Click "Add Task" → fill the form → submit → WhatsApp arrives on Member C's phone
5. Click "Study Buddy" → paste notes → show flashcards flipping
6. Click "Notice" → paste notice → show AI summary

**Keep the browser zoomed to 90% so judges can read everything clearly.**

---

## Quick reference — keyboard shortcuts you'll use

```
npm run dev          ← start the app
Ctrl+C               ← stop the app
Ctrl+Shift+P         ← VS Code command palette
Ctrl+`               ← open terminal in VS Code
```

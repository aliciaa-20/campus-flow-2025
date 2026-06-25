# 🟥 Member C — AI + Automation Guide
### Your job: Groq API key, n8n workflows, Twilio WhatsApp
> You own everything that runs automatically — the AI brain and the WhatsApp + Calendar magic. This is what judges will remember.

---

## ⏱ Your Timeline
| Time | What you do |
|---|---|
| 0:00 – 0:20 | Get Groq key + join Twilio sandbox + create both n8n webhooks |
| 0:20 – 0:55 | Build n8n Workflow 1 (Deadline Reminder) fully + test curl |
| 0:55 – 1:30 | Build n8n Workflow 2 (Notice Summarizer) fully + test curl |
| 1:30 – 2:00 | Test both flows end to end with real WhatsApp + Calendar |
| 2:00 – 2:30 | Test AI routes (flashcards + MCQ) with Postman or browser |
| 2:30 – 3:00 | Keep phone ready for demo, prepare n8n dashboard |

---

## STEP 1 — Get Groq API key (5 min)

1. Go to `console.groq.com`
2. Sign up with Google (fastest)
3. Go to "API Keys" in the left sidebar
4. Click "Create API Key" → name it `campusflow`
5. Copy the key → it starts with `gsk_...`

**Share this with Member B immediately** so they can put it in `.env.local`:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

---

## STEP 2 — Join Twilio WhatsApp Sandbox (10 min)

The Twilio Sandbox is the free way to send WhatsApp messages without a business account. Every phone that wants to receive messages must "join" the sandbox first.

### 2.1 Create Twilio account
1. Go to `twilio.com` → Start for free
2. Sign up → verify your phone number

### 2.2 Get your credentials
1. From the Twilio console homepage, copy:
   - `Account SID` (starts with `AC...`)
   - `Auth Token` (click the eye icon to reveal)

**Share both with Member B for `.env.local`:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2.3 Join the sandbox
1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. You'll see a number like `+14155238886` and a join code like `join silver-lion`
3. From your phone's WhatsApp, send that exact message to `+14155238886`
4. You'll get a reply: "You are now connected to the sandbox"
5. **All team members who want to receive test messages must do this step on their phones.**

---

## STEP 3 — Create n8n account (2 min)

1. Go to `n8n.cloud` → Sign up free (no credit card)
2. You'll land on the n8n dashboard
3. You get 5 workflows and 2500 executions/month free

---

## STEP 4 — Build n8n Workflow 1: Deadline Reminder

This workflow fires every time a student adds a task. It:
- Creates a Google Calendar event
- Waits until 24 hours before the deadline
- Sends a WhatsApp message

### 4.1 Create workflow
1. Click "+ New Workflow"
2. Name it: `CampusFlow — Deadline Reminder`

### 4.2 Add Webhook node (first node)
1. Click the "+" button → search "Webhook" → click it
2. Settings:
   - HTTP Method: `POST`
   - Path: `deadline-reminder`
   - Authentication: `None`
3. Click "Listen for test event" — this activates the test URL
4. Copy the test URL (looks like `https://xxxx.app.n8n.cloud/webhook-test/deadline-reminder`)
5. **Share this URL with Member B immediately:**
   ```
   N8N_DEADLINE_WEBHOOK=https://xxxx.app.n8n.cloud/webhook-test/deadline-reminder
   ```

### 4.3 Add Set node (formats the dates)
1. Click "+" after Webhook → search "Set" → click it
2. Click "Add field" twice:

**Field 1:**
- Name: `deadlineISO`
- Value: `{{ new Date($json.deadline).toISOString() }}`

**Field 2:**
- Name: `reminderTime`
- Value: `{{ new Date(new Date($json.deadline).getTime() - 86400000).toISOString() }}`

> `86400000` milliseconds = 24 hours

### 4.4 Connect Google Calendar node
1. Click "+" after Set → search "Google Calendar" → click it
2. Click "Create new credential" → Sign in with your Google account → Allow all permissions
3. Settings:
   - Operation: `Create`
   - Calendar: select your calendar from dropdown
   - Title: `{{ $('Webhook').item.json.taskTitle }} — {{ $('Webhook').item.json.subject }}`
   - Start: `{{ $json.deadlineISO }}`
   - End: `{{ new Date(new Date($json.deadlineISO).getTime() + 3600000).toISOString() }}`
   - Description: `CampusFlow deadline reminder for {{ $('Webhook').item.json.studentName }}`

### 4.5 Add Wait node (waits until 24 hours before)
1. Click "+" after Google Calendar → search "Wait" → click it
2. Settings:
   - Wait Until: `Specific time`
   - Date/Time: `{{ $('Set').item.json.reminderTime }}`

> **Important during testing:** The Wait node will pause the execution. For demo purposes, set a time 1 minute in the future to test that WhatsApp fires. Then set it back to the real 24-hour logic.

### 4.6 Add Twilio node (sends WhatsApp)
1. Click "+" after Wait → search "Twilio" → click it
2. Click "Create new credential" → enter:
   - Account SID: paste from `.env.local`
   - Auth Token: paste from `.env.local`
3. Settings:
   - From: `whatsapp:+14155238886`
   - To: `whatsapp:+91{{ $('Webhook').item.json.phone }}`
   - Message: 
     ```
     ⏰ Hi {{ $('Webhook').item.json.studentName }}! Your {{ $('Webhook').item.json.subject }} task '{{ $('Webhook').item.json.taskTitle }}' is due tomorrow! Check your Google Calendar. — CampusFlow 🎓
     ```

### 4.7 Save and test Workflow 1
Click "Save" in top right.

Now test it by running this in your terminal:
```bash
curl -X POST YOUR_N8N_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Aarush",
    "phone": "YOUR_PHONE_NUMBER",
    "subject": "DBMS",
    "deadline": "2025-07-02T10:00:00.000Z",
    "taskTitle": "ER Diagram Assignment"
  }'
```

Replace `YOUR_N8N_WEBHOOK_URL` with the URL from Step 4.2
Replace `YOUR_PHONE_NUMBER` with your 10-digit number (no +91)

Expected result:
- n8n shows a green "Success" execution
- Google Calendar event appears in your calendar
- WhatsApp message arrives on your phone (may take up to 1 min)

✅ If all three work → Workflow 1 is done.

---

## STEP 5 — Build n8n Workflow 2: Notice Summarizer

This workflow fires when someone submits a notice. It:
- Takes the AI summary that was already generated by Groq (passed in the payload)
- Creates a Google Calendar event for the notice date
- Loops through all phone numbers and sends WhatsApp to each

### 5.1 Create new workflow
1. Click "+" (new workflow) → name it: `CampusFlow — Notice Summarizer`

### 5.2 Add Webhook node
1. Same as before → HTTP Method: `POST` → Path: `notice-summarizer`
2. Click "Listen for test event" → copy URL
3. **Share this URL with Member B:**
   ```
   N8N_NOTICE_WEBHOOK=https://xxxx.app.n8n.cloud/webhook-test/notice-summarizer
   ```

### 5.3 Add Google Calendar node
1. Click "+" after Webhook → Google Calendar
2. Use the same credential as before (already connected)
3. Settings:
   - Operation: `Create`
   - Title: `{{ $json.eventTitle }}`
   - Start: `{{ $json.eventDate }}`
   - End: `{{ new Date(new Date($json.eventDate).getTime() + 3600000).toISOString() }}`
   - Description: `{{ $json.aiSummary }}`

### 5.4 Add Loop Over Items node
1. Click "+" after Google Calendar → search "Loop Over Items" → click it
2. Settings:
   - Input: `{{ $('Webhook').item.json.phoneList }}`

This splits the `phoneList` array and runs the next node for each phone number.

### 5.5 Add Twilio node (inside the loop)
1. Click "+" inside the loop → Twilio
2. Settings:
   - From: `whatsapp:+14155238886`
   - To: `whatsapp:+91{{ $json }}`
   - Message:
     ```
     📣 Notice Alert:
     {{ $('Webhook').item.json.aiSummary }}
     
     Added to your calendar! — CampusFlow
     ```

### 5.6 Save and test Workflow 2
```bash
curl -X POST YOUR_N8N_NOTICE_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "noticeText": "Mid-semester exams from July 15 to 20. Carry ID cards.",
    "eventTitle": "Mid-Semester Exams",
    "eventDate": "2025-07-15T09:00:00.000Z",
    "phoneList": ["YOUR_PHONE_NUMBER"],
    "aiSummary": "• Exams from July 15–20\n• ID cards mandatory\n• Hall tickets on July 13"
  }'
```

Expected result:
- Calendar event created
- WhatsApp message arrives with the summary

✅ If both work → Workflow 2 is done.

---

## STEP 6 — Understand the AI routes (you don't write these, but you own them)

The repo already has 3 Groq API routes. Here's what they do:

### `app/api/ai/flashcards/route.ts`
- Takes: `{ notes: "..." }`
- Sends to Groq: "give me 5 flashcards as JSON"
- Returns: `{ flashcards: [{ question: "...", answer: "..." }] }`

**Test in browser:** go to `localhost:3000/study` → paste any text → click Generate Flashcards

### `app/api/ai/mcq/route.ts`
- Takes: `{ notes: "..." }`
- Sends to Groq: "give me 5 MCQs as JSON"
- Returns: `{ mcqs: [{ question: "...", options: [...], correct: 0 }] }`

**Test in browser:** same page → click Generate MCQ Quiz

### `app/api/notice/route.ts`
- Takes: `{ noticeText, eventTitle, eventDate, phoneList }`
- Calls Groq to generate 3-bullet summary
- Fires n8n Workflow 2 with the summary
- Returns: `{ summary: "..." }`

---

## STEP 7 — What to do if Groq returns broken JSON

The AI sometimes wraps the response in markdown code fences like:
````
```json
[{"question": "..."}]
```
````

The route handler already strips these:
```ts
const cleaned = raw.replace(/```json|```/g, '').trim()
```

But if it still fails, add a `console.log(raw)` inside the route and check what Groq actually returned. The fix is almost always adjusting the prompt to say "return ONLY raw JSON, no markdown".

---

## STEP 8 — Common issues and fixes

| Problem | Fix |
|---|---|
| WhatsApp not received | Make sure your number joined the sandbox (Step 2.3) |
| n8n shows "Workflow could not be started" | You're in test mode — click "Listen for test event" first |
| Google Calendar event not created | Re-authorize the Google credential in n8n |
| Groq returns 401 | `GROQ_API_KEY` is wrong in `.env.local` |
| Twilio error: "To number is not a valid WhatsApp number" | The +91 prefix might be doubled — check your Twilio node |
| curl gives `connection refused` | Make sure `npm run dev` is running on your machine |
| n8n Wait node hangs | During testing, change the wait time to 30 seconds, not 24 hours |

---

## STEP 9 — Before the demo (Phase 5 checklist)

```
□ Switch n8n workflows from Test URL to Production URL
  (In each workflow: Webhook node → toggle "Test" to "Production" → copy new URL → update .env.local)

□ Have your phone WhatsApp open and visible to judges

□ Keep n8n dashboard open in a browser tab — judges love seeing the green execution logs

□ Do a dry run 15 min before the demo:
  - Add a task on the app
  - Confirm WhatsApp arrives within 30 seconds
  - Confirm Calendar event is visible
  - Paste a notice → confirm summary appears
```

---

## STEP 10 — Your demo role

During the live demo, you are the "proof it works" person.

1. Hold your phone facing the camera/judges
2. When Member A submits the task form → show the WhatsApp arriving live
3. When judges ask "how does the automation work?" → open the n8n dashboard and walk through the nodes:
   - "This is the webhook that triggers when a task is added"
   - "This node creates the Google Calendar event"
   - "This node waits until 24 hours before the deadline"
   - "This node sends the WhatsApp via Twilio"

That walk-through alone is worth +5 presentation points with most judges.

---

## Quick reference — things to keep open during the hackathon

| Tab | URL |
|---|---|
| n8n dashboard | `app.n8n.cloud` |
| Groq console | `console.groq.com` |
| Twilio console | `console.twilio.com` |
| Your WhatsApp | keep on phone |
| Google Calendar | `calendar.google.com` |

# Product Requirements Document (PRD)
## Community Meeting Management Platform
### Version 1.0 | Status: In Development

---

## 1. PURPOSE OF THIS DOCUMENT

This PRD defines every functional requirement for the Community Meeting Management Platform. It exists to tell the development system exactly what needs to work, how it should behave, and what "done" looks like for each feature. If a feature is not working, this document is the reference to fix it against.

The platform extends a pre-existing MOM (Minutes of Meeting) generator — built with Whisper STT, Llama 3.2 via Ollama, and a multilingual pipeline (Hindi, Gujarati, English) — into a full community meeting lifecycle platform.

---

## 2. PRODUCT OVERVIEW

### What this product is
A web application that manages the complete lifecycle of community meetings — from scheduling and invitation to AI-generated minutes and action item tracking — for two types of users: Admins who control everything, and Organizers who manage their own meetings.

### What already exists (pre-built, must be preserved)
- Audio upload → Whisper transcription (EN / HI / GU)
- Language detection via `langdetect`
- Hindi/Gujarati → English translation via `deep-translator`
- Llama 3.2 MOM generation via Ollama
- MOM output: Meeting Info, Agenda, Discussion Summary, Key Decisions, Action Items table, Next Steps
- Download MOM as `.txt`

### What must be built or fixed
Everything described in this document.

---

## 3. USER ROLES

### 3.1 Community Admin
The Admin has full visibility and control over the entire platform.

**The Admin can:**
- Create, edit, and archive communities and groups
- Add, remove, promote, or demote any user
- View every meeting, MOM, and attendance record across the platform
- Cancel, reschedule, or reassign the organizer of any meeting
- Access the full analytics dashboard
- Configure platform-wide settings (MOM template, language defaults, email config)
- Manage notification settings for the whole platform

**The Admin cannot:**
- Delete meeting records or MOMs (archive only, for audit trail)

---

### 3.2 Meeting Organizer
An Organizer manages meetings within the groups they belong to.

**The Organizer can:**
- Schedule meetings within their group(s)
- Create and manage groups under the community they are a member of
- Send invitations, manage join permissions
- Build and share a pre-meeting agenda
- Mark attendance during a meeting
- Capture live decisions and action items mid-meeting
- Upload audio or enter text to trigger MOM generation
- Review and edit the AI-generated MOM draft before publishing
- Approve and publish the final MOM
- View analytics for their own meetings only

**The Organizer cannot:**
- Access other organizers' meetings or MOMs
- Modify community-wide settings

---

### 3.3 Participant (Invited Member)
A Participant is invited to a meeting by an organizer.

**The Participant can:**
- Receive and respond to meeting invitations (Accept / Decline / Tentative)
- View the shared agenda before the meeting
- Join a meeting (subject to the organizer's join policy)
- Add personal notes during a meeting
- Receive the published MOM after the meeting
- View and update the status of their own assigned action items

**The Participant cannot:**
- Create or schedule meetings
- View other participants' notes
- Generate or edit MOMs

---

## 4. FUNCTIONAL REQUIREMENTS

---

### FR-01: AUTHENTICATION & USER MANAGEMENT

#### FR-01.1 — User Registration
**What must work:**
- User submits: full name, email address, password
- System validates: email is unique, password minimum 8 characters
- System creates the user account with default role: `PARTICIPANT`
- System returns a JWT access token and refresh token on success
- System rejects duplicate email with a clear error: "An account with this email already exists"

**Acceptance criteria:**
- Registering with a new email → account created, tokens returned
- Registering with an existing email → 409 error returned
- Password under 8 characters → 422 validation error returned

---

#### FR-01.2 — User Login
**What must work:**
- User submits email + password
- System validates credentials
- On success: returns JWT access token (expires in 15 minutes) + refresh token (expires in 7 days)
- On failure: returns 401 with message "Invalid email or password" — never specify which field is wrong

**Acceptance criteria:**
- Correct credentials → tokens returned, user can access protected routes
- Wrong password → 401 returned
- Non-existent email → 401 returned (same message, no email enumeration)

---

#### FR-01.3 — Token Refresh
**What must work:**
- Client sends the refresh token to `POST /auth/refresh`
- System returns a new access token
- If refresh token is expired or invalid → 401 returned, user must log in again

---

#### FR-01.4 — Role Assignment
**What must work:**
- New users default to `PARTICIPANT`
- Admin can change any user's role to: `ADMIN` | `ORGANIZER` | `PARTICIPANT`
- Role change takes effect immediately on next authenticated request
- Admin cannot demote themselves if they are the only Admin in the system

---

#### FR-01.5 — User Profile
**What must work:**
- User can view and update: name, avatar, language preference (EN / HI / GU), notification preferences (email on/off per notification type)
- Email address cannot be changed after registration
- Avatar uploaded as image file, stored locally, served as static URL

---

### FR-02: COMMUNITY & GROUP MANAGEMENT

#### FR-02.1 — Community Creation
**What must work:**
- Admin creates a community with: name, description
- Community has a unique slug generated from the name
- Admin who creates the community is automatically its first Admin member

**Acceptance criteria:**
- Community created → appears in Admin dashboard
- Duplicate community name → system appends number suffix to slug, allows creation

---

#### FR-02.2 — Community Membership
**What must work:**
- Admin adds users to a community by searching their email or name
- Admin removes users from a community (removes them from all groups within it too)
- User can be a member of multiple communities
- Removing a user from a community does not delete their account

---

#### FR-02.3 — Group Creation & Management
**What must work:**
- Admin or Organizer creates a group inside a community with: name, description
- Groups can have one level of sub-groups (parent_group_id)
- Group creator is automatically the group's Organizer
- Admin can create groups in any community
- Organizer can only create groups in communities they belong to

**Acceptance criteria:**
- Group created → appears under the community in the sidebar
- Group with sub-group → sub-group indented under parent in UI

---

#### FR-02.4 — Group Membership
**What must work:**
- Organizer adds community members to their group by searching name/email
- Organizer removes members from their group
- Organizer promotes a group member to Organizer role for that group
- Admin can manage membership of any group

---

### FR-03: MEETING LIFECYCLE

The meeting passes through these statuses in order:
`DRAFT → PUBLISHED → LIVE → ENDED → ARCHIVED`

Status transitions:
- `DRAFT`: created but not yet sent to invitees
- `PUBLISHED`: invitations sent, RSVP open
- `LIVE`: meeting is in progress (organizer manually marks as live)
- `ENDED`: organizer marks meeting as ended, MOM generation becomes available
- `ARCHIVED`: Admin archives after MOM is published

No status can be skipped. No status can go backwards (except Admin can move LIVE back to PUBLISHED if meeting hasn't actually started yet).

---

#### FR-03.1 — Create Meeting (DRAFT)
**What must work:**
- Organizer fills in: title, description (optional), date, start time, expected duration (minutes), location (text address or video call link), join policy
- Join policy options: `OPEN` (anyone in community can join), `INVITE_ONLY` (only invited users), `APPROVAL_REQUIRED` (organizer approves each request)
- Meeting is linked to one group
- Recurring option: `ONE_TIME` | `WEEKLY` | `MONTHLY`
- Meeting saved in DRAFT status — not visible to invitees yet

**Acceptance criteria:**
- All required fields filled → meeting created in DRAFT, appears in organizer's dashboard
- Missing required field → validation error with field name highlighted
- Date in the past → validation error: "Meeting date must be in the future"

---

#### FR-03.2 — Invite Members (PUBLISHED)
**What must work:**
- Organizer selects invitees: individual community members by name/email search, OR an entire group at once, OR an external email address (non-platform user)
- Organizer clicks "Send Invitations" → meeting status moves to PUBLISHED
- System sends invitation email to each invitee (see FR-06 Notifications)
- Each invitation has a unique signed token for RSVP (valid until meeting date)
- External email invitees can RSVP without creating an account
- Organizer can add more invitees after publishing — new invitations sent immediately

**Acceptance criteria:**
- Invitations sent → each invitee receives email with RSVP link
- RSVP link clicked by external user (no account) → RSVP recorded without login
- Organizer's RSVP dashboard shows correct counts: Accepted / Declined / Tentative / Pending

---

#### FR-03.3 — RSVP
**What must work:**
- Clicking the RSVP link in email opens a page with three buttons: Accept / Decline / Tentative
- Selecting a response records it and shows a confirmation message
- RSVP can be changed up until the meeting starts (status moves to LIVE)
- RSVP status visible to the organizer in real time
- If a logged-in user receives an invitation, they can also RSVP from inside the platform dashboard

---

#### FR-03.4 — Agenda Builder (PRE-MEETING)
**What must work:**
- Organizer adds agenda items: topic name, presenter name (optional), duration in minutes
- Agenda items can be reordered via drag-and-drop
- Each agenda item can have one file attachment (PDF, DOCX, image)
- Total agenda duration auto-calculated and shown vs meeting duration
- Organizer can edit agenda items after saving
- Agenda is versioned — system logs when agenda was last edited
- Organizer clicks "Share Agenda" → agenda emailed to all Accepted RSVPs immediately
- Agenda also auto-sent 24 hours before meeting to all Accepted RSVPs (even if not manually shared)

**Acceptance criteria:**
- Agenda items added, reordered, saved → correct order persists
- "Share Agenda" clicked → participants receive email with agenda
- If meeting duration is 60 min and agenda items total 90 min → warning shown: "Agenda exceeds meeting duration by 30 minutes"

---

#### FR-03.5 — Smart Agenda Builder (AI)
**What must work:**
- Organizer types a meeting topic/title in the agenda builder
- Clicks "AI Suggest Agenda" button
- System fetches the last 5 published MOMs from the same group
- Sends topic + MOM summaries to Llama 3.2
- Llama returns a suggested agenda as a list of items with topic, presenter (if inferable), and duration
- Suggested agenda displayed as a draft — organizer edits and confirms before saving
- If no past MOMs exist for the group → Llama generates a generic agenda based on topic only

**Llama prompt (use exactly):**
```
You are a meeting facilitator for a community organization.
Based on the meeting topic and past meeting records below, generate a structured agenda.

Meeting topic: {topic}
Group: {group_name}
Past meeting summaries (most recent first):
{past_mom_summaries}

Return ONLY a valid JSON array. No explanation, no markdown, no preamble:
[{"topic": "string", "presenter": "string or null", "duration_minutes": number}]
```

**Acceptance criteria:**
- Past MOMs exist → AI returns relevant agenda items referencing past discussion topics
- No past MOMs → AI returns reasonable generic agenda for the topic
- Llama unavailable → button shows error: "AI suggestion unavailable. Please build agenda manually." — no crash

---

#### FR-03.6 — Live Meeting Mode (LIVE)
**What must work:**
- Organizer clicks "Start Meeting" → status moves to LIVE
- Live meeting screen shows:
  - Agenda checklist (topics with checkboxes — organizer checks them off as covered)
  - Timer per agenda item (counts up from 0, turns red when time allocated is exceeded)
  - Attendance panel: list of invited members, organizer marks each as PRESENT / ABSENT / LATE
  - Quick capture panel: two buttons — "Log Decision" and "Log Action Item"
    - Log Decision: text input → saved instantly
    - Log Action Item: owner name, task description, deadline → saved instantly
  - Live transcript panel (see FR-03.7)

**Acceptance criteria:**
- Agenda item checked → visually marked done, timer stops
- Attendance marked → saved immediately, reflected in final MOM attendee list
- Decision logged → appears in decisions list, persists after page refresh
- Action item logged → appears in action items list with owner and deadline

---

#### FR-03.7 — Live Transcription (AI)
**What must work:**
- Live meeting screen has a "Start Transcription" button
- Browser captures microphone audio via Web Audio API
- Audio sent to backend via WebSocket in 30-second chunks
- Backend passes each chunk to Whisper for transcription
- Transcribed text appended to the live transcript panel in real time
- Language of each chunk detected (EN / HI / GU) — language badge shown
- If HI or GU detected → chunk translated to English, both versions shown (original + translation)
- Organizer can edit the live transcript directly in the panel
- "Stop Transcription" button stops capture and closes WebSocket

**Acceptance criteria:**
- Microphone active → transcript appears within 5 seconds of speaking
- Hindi spoken → transcript shows Hindi text + English translation below it
- WebSocket disconnects → auto-reconnect attempted once, then error shown: "Transcription disconnected. Click to reconnect."
- Whisper not available → "Live transcription unavailable. You can type notes manually." — no crash

---

#### FR-03.8 — End Meeting & MOM Generation (ENDED)
**What must work:**
- Organizer clicks "End Meeting" → status moves to ENDED
- System assembles MOM context automatically:
  - Meeting metadata (title, date, time, location, duration, organizer name)
  - Attendee list (present, absent, late) from attendance marking
  - Agenda items (topics, presenters, durations)
  - Live-captured decisions (from FR-03.6)
  - Live-captured action items (from FR-03.6)
  - Full transcript text (from live transcription OR uploaded audio OR manually typed)
- Organizer sees MOM generation screen with three input options:
  - Option A: Use the live transcript (auto-populated if transcription was running)
  - Option B: Upload an audio file (.mp3 / .wav / .m4a / .ogg)
  - Option C: Type or paste discussion points manually
- Organizer clicks "Generate MOM" → job queued, progress shown (steps visible: Transcribing → Translating → Generating → Quality Check → Done)
- Generated MOM returned as editable rich text

**MOM AI pipeline (execute in this exact order):**
1. If audio file → run Whisper → get transcript text
2. Detect language of transcript (langdetect)
3. If HI or GU → translate full transcript to English (deep-translator)
4. Assemble context block (see template below)
5. Send to Llama 3.2 with MOM generation prompt
6. Run Llama quality check pass on generated MOM
7. Return draft MOM + quality check warnings to frontend

**Llama MOM generation prompt (use exactly):**
```
You are a Senior Professional Meeting Secretary. Generate a complete, formal Minutes of Meeting document based on the information below.

=== MEETING CONTEXT ===
Title: {meeting_title}
Date: {meeting_date}
Time: {meeting_time}
Location: {meeting_location}
Duration: {duration_minutes} minutes
Organizer: {organizer_name}

=== ATTENDEES ===
Present: {present_members}
Absent: {absent_members}
Late: {late_members}

=== AGENDA ===
{agenda_items_numbered}

=== DECISIONS CAPTURED DURING MEETING ===
{live_decisions}

=== ACTION ITEMS CAPTURED DURING MEETING ===
{live_action_items}

=== MEETING TRANSCRIPT / DISCUSSION NOTES ===
{transcript_or_notes}

=== INSTRUCTIONS ===
Generate a professional MOM with EXACTLY these sections in this order:
1. MEETING INFORMATION
2. ATTENDEES
3. AGENDA
4. DISCUSSION SUMMARY (summarize discussion per agenda item)
5. KEY DECISIONS (numbered list)
6. ACTION ITEMS (markdown table with columns: Owner | Task | Deadline | Status)
7. NEXT STEPS
8. NEXT MEETING (write "Not scheduled" if not mentioned)

Use formal business English. Be specific. Do not invent information not present in the transcript.
```

**Llama quality check prompt (run after MOM is generated):**
```
You are a QA reviewer for meeting minutes. Review the MOM below and identify any gaps.

=== GENERATED MOM ===
{generated_mom}

=== ORIGINAL AGENDA ITEMS ===
{agenda_items}

Check for these issues:
1. Agenda items with no corresponding discussion summary
2. Action items missing an owner name
3. Action items missing a deadline
4. Decisions that are too vague to be actionable

Return ONLY valid JSON. No explanation:
{
  "missing_agenda_coverage": ["string"],
  "incomplete_action_items": [{"item": "string", "issue": "string"}],
  "vague_decisions": ["string"],
  "quality_score": "good" | "needs_review" | "poor"
}
```

**Acceptance criteria:**
- All three input methods (live transcript / audio upload / manual text) successfully produce a MOM
- MOM contains all 8 required sections
- Quality check warnings shown inline in the review screen (highlighted in yellow)
- If Ollama is down → clear error: "MOM generation is unavailable. Ollama is not running. Please start Ollama and try again." — no crash
- If audio upload fails Whisper → error: "Audio transcription failed. Please try uploading again or type notes manually."

---

#### FR-03.9 — MOM Review & Approval
**What must work:**
- Generated MOM displayed in a rich text editor (fully editable)
- Quality check warnings shown above the editor:
  - Yellow banner per warning type with specific missing item named
  - Organizer can dismiss individual warnings after fixing them
- Organizer edits the MOM as needed
- "Approve & Publish" button → MOM status set to PUBLISHED
- Published MOM cannot be edited (read-only) — if changes needed, Admin can unlock for re-editing
- MOM stored as both plain text and HTML in the database

**Acceptance criteria:**
- Draft MOM editable in the rich text editor
- Approving MOM → triggers distribution email (FR-06.5)
- Approved MOM visible to all attendees in their meeting history

---

#### FR-03.10 — MOM Distribution
**What must work:**
- On MOM approval, system sends MOM email to:
  - All attendees who were marked PRESENT or LATE
  - All attendees who were marked ABSENT (so they know what was decided)
- Email contains the full MOM content formatted cleanly
- MOM downloadable as PDF from inside the platform
- System tracks who opened the MOM email (read receipt via 1x1 tracking pixel)
- Organizer can see read receipt status per recipient

---

### FR-04: ACTION ITEM TRACKER

#### FR-04.1 — Action Item Creation
**What must work:**
- Action items created from three sources:
  1. AI extraction from generated MOM (automatic on MOM generation)
  2. Live capture during meeting (FR-03.6)
  3. Manual creation by Organizer or Admin at any time
- Each action item has: title, description (optional), assigned_to (user), due_date, status, linked meeting, linked MOM
- Status values: `OPEN` | `IN_PROGRESS` | `DONE` | `DEFERRED`

---

#### FR-04.2 — Action Item Management
**What must work:**
- Assigned participant can update status of their own action items
- Organizer can update any action item from their meetings
- Admin can update any action item
- All status changes logged with timestamp and who changed it
- Filter action items by: status, group, assigned member, due date range

---

#### FR-04.3 — Smart Follow-up Emails (AI)
**What must work:**
- Celery Beat checks every day at 8:00 AM for action items where:
  - Due date is 3 days away and status is OPEN or IN_PROGRESS → send reminder
  - Due date passed and status is not DONE → send overdue notice to assignee AND organizer
- Email body written by Llama 3.2 — personalized per action item, not a generic template

**Llama follow-up email prompt (use exactly):**
```
You are a professional secretary writing a follow-up email on behalf of {organizer_name}.

Context:
- Action item: {action_description}
- Assigned to: {assignee_name}
- Deadline: {deadline_date}
- Meeting this came from: {meeting_title} held on {meeting_date}
- Situation: {situation}

Where situation is one of:
- "due_soon" (deadline is 3 days away)
- "overdue" (deadline has passed)

Write a short, professional, friendly email (3-4 sentences). Reference the specific task and meeting.
Do not use generic filler phrases like "Hope this email finds you well."
Return ONLY the email body text. No subject line. No signature.
```

**Acceptance criteria:**
- Action item due in 3 days + status OPEN → assignee receives reminder email
- Action item overdue + status not DONE → assignee AND organizer receive overdue notice
- Email content references the specific task name and meeting — not generic text
- Llama unavailable → fall back to a plain text template email — do not skip sending

---

### FR-05: SEMANTIC MOM SEARCH (AI)

#### FR-05.1 — MOM Indexing
**What must work:**
- Every time a MOM is published (status → PUBLISHED), the MOM text is automatically embedded
- Embedding model: `nomic-embed-text` via Ollama
- Stored in ChromaDB with metadata: `mom_id`, `meeting_id`, `group_id`, `community_id`, `meeting_date`, `meeting_title`
- If Ollama is unavailable at publish time → embedding queued as a Celery task, retried up to 3 times

---

#### FR-05.2 — Search Interface
**What must work:**
- Search bar available on the community dashboard: "Search past meetings…"
- User types a natural language query (e.g. "When did we discuss the budget?", "What was decided about the vendor contract?")
- System embeds the query using `nomic-embed-text` and queries ChromaDB
- Returns top 3 most relevant MOM excerpts
- Each result shows: meeting title, date, group name, and the relevant paragraph
- Clicking a result opens the full MOM

**Acceptance criteria:**
- Query about a topic discussed in a past meeting → returns the correct meeting as a top result
- Query about a topic never discussed → returns "No relevant past meetings found"
- Search scoped to user's accessible meetings only (Participant sees only meetings they attended, Organizer sees their meetings, Admin sees all)

---

### FR-06: NOTIFICATION SERVICE

All notifications sent via email using HTML templates. All emails queued via Celery — never sent synchronously.

#### FR-06.1 — Meeting Invitation Email
**Trigger:** Organizer clicks "Send Invitations"
**Recipients:** All invited members
**Content:** Meeting title, date, time, location, organizer name, RSVP buttons (Accept / Decline / Tentative) linking to signed RSVP URL
**Must work:** External recipients (no account) can RSVP via the link without logging in

---

#### FR-06.2 — RSVP Confirmation Email
**Trigger:** Any invitee submits RSVP
**Recipients:** The organizer
**Content:** "[Name] has [accepted / declined / tentatively accepted] your invitation to [Meeting Title]"

---

#### FR-06.3 — Agenda Shared Email
**Trigger:** Organizer clicks "Share Agenda" OR 24 hours before meeting (whichever comes first)
**Recipients:** All invitees with ACCEPTED status
**Content:** Meeting title, date, time, full agenda with topics, presenters, and durations

---

#### FR-06.4 — Meeting Reminder Email
**Trigger:** 1 hour before meeting start time (Celery Beat)
**Recipients:** All invitees with ACCEPTED or TENTATIVE status
**Content:** Meeting title, date, start time, location/video link, link to view agenda

---

#### FR-06.5 — MOM Distribution Email
**Trigger:** Organizer approves and publishes MOM
**Recipients:** All attendees (present, absent, late)
**Content:** Full formatted MOM, link to view online, link to download PDF

---

#### FR-06.6 — Action Item Reminder Email
**Trigger:** 3 days before due date, status is OPEN or IN_PROGRESS (Celery Beat daily at 8 AM)
**Recipients:** Assignee only
**Content:** AI-written personalized reminder (see FR-04.3)

---

#### FR-06.7 — Action Item Overdue Email
**Trigger:** Due date passed, status is not DONE (Celery Beat daily at 8 AM)
**Recipients:** Assignee + Meeting Organizer
**Content:** AI-written overdue notice (see FR-04.3)

---

#### FR-06.8 — Weekly Insights Digest
**Trigger:** Every Monday at 9:00 AM (Celery Beat)
**Recipients:** All Admin users
**Content:** AI-generated digest (see FR-07.2)

---

### FR-07: ANALYTICS DASHBOARD

#### FR-07.1 — Organizer Analytics
**What must be shown:**
- Total meetings this month vs last month (number + trend arrow)
- Average attendance rate across all meetings (%)
- Action item completion rate (% of items marked DONE)
- RSVP acceptance rate (% of invitations accepted)
- Average MOM generation time (seconds from "Generate" click to draft returned)
- List of meetings with lowest attendance (flag for organizer awareness)

---

#### FR-07.2 — Admin Analytics + AI Digest
**What must be shown (in addition to organizer metrics, platform-wide):**
- Total meetings across all communities
- Most active groups (by meeting count)
- Member engagement score per user (attendance frequency as a percentage)
- Action item completion rate by group
- Meeting frequency trend chart (weekly, last 12 weeks — Recharts line chart)
- MOM turnaround time trend (weekly average)

**AI weekly digest (generated by Llama, emailed Monday 9 AM):**
- Summary of all meetings held last week
- Groups that had no meetings but had pending action items
- Action items with highest overdue rate
- Attendance rate trend (improving / declining)

**Llama digest prompt:**
```
You are a community operations analyst. Write a concise weekly digest report for community admins.

Data for the past 7 days:
{weekly_stats_json}

Write a professional digest covering:
1. Meetings overview (held, cancelled, attendance rate)
2. Action item health (raised, completed, overdue)
3. Notable observations (groups most and least active)
4. One recommendation for improving community meeting effectiveness

Keep it under 250 words. Use plain business English. Return only the report text.
```

---

### FR-08: ADMIN CONTROL PANEL

#### FR-08.1 — User Management
**What must work:**
- Searchable, filterable table of all users: name, email, role, community memberships, last active
- Admin can change any user's role from this table
- Admin can deactivate a user (cannot login, but data preserved)
- Admin can reactivate a deactivated user
- Admin cannot delete users — only deactivate

---

#### FR-08.2 — Meeting Oversight
**What must work:**
- Table of all meetings across the platform: title, group, organizer, status, date
- Admin can cancel any meeting (status → ARCHIVED, cancellation email sent to all invitees)
- Admin can reassign organizer of any meeting
- Admin can view any meeting's MOM, attendance, and action items

---

#### FR-08.3 — Platform Settings
**What must work:**
- Default MOM template fields (Admin can toggle which sections are required)
- Default language (EN / HI / GU) — used as fallback when user preference not set
- Email configuration (SMTP host, port, sender address, sender name)
- Notification toggles (enable/disable each notification type platform-wide)

---

#### FR-08.4 — System Health Monitor
**What must work:**
- `GET /health` endpoint returns JSON status of all services
- Health screen in Admin panel shows live status of:
  - Ollama (ping `GET /api/tags` → check if Llama 3.2 model is loaded)
  - Whisper (check if model file exists and loads without error)
  - PostgreSQL (connection check)
  - Redis (ping)
  - Celery worker (check active workers via inspect)
  - ChromaDB (collection count check)
- Each service shows: status badge (Online / Degraded / Offline) + last checked timestamp
- Auto-refreshes every 30 seconds

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### Performance
- MOM generation (Llama) must complete within 120 seconds for a 1-hour meeting transcript
- API endpoints (non-AI) must respond within 500ms under normal load
- Live transcription WebSocket must deliver transcript chunks within 5 seconds of audio capture

### Reliability
- Every AI operation (Whisper, Llama, embeddings) has a fallback path — never crash the UI
- Celery tasks retry up to 3 times with exponential backoff before marking as failed
- If a Celery task fails after all retries, log the failure and notify the Admin via email

### Privacy
- Whisper transcription: 100% local
- Llama MOM generation: 100% local via Ollama
- Translation: deep-translator (hits Google API) — document this clearly in UI
- ChromaDB: embedded local vector store
- No meeting audio or transcript data sent to any external service except the translation step

### Security
- All routes (except RSVP and health check) require valid JWT
- Role-based access enforced at the route level — not just the UI
- RSVP tokens signed with server secret, expire on meeting date
- Passwords hashed with bcrypt (cost factor 12)
- File uploads validated: type whitelist (pdf, docx, jpg, png, mp3, wav, m4a), max size 50MB

---

## 6. ERROR HANDLING REQUIREMENTS

Every feature must handle these failure cases gracefully — no unhandled exceptions, no blank screens:

| Failure | Expected Behaviour |
|---|---|
| Ollama not running | Show inline error with message "Ollama is offline. Start it with `ollama serve`." |
| Whisper model not found | Show inline error "Whisper model not loaded. Run `whisper download base`." |
| Audio file format unsupported | Show field-level error "Unsupported format. Please upload MP3, WAV, or M4A." |
| langdetect fails (too short / mixed language) | Default to English, proceed without blocking |
| Translation API unreachable | Proceed with original text, show warning "Translation unavailable. MOM generated from original language text." |
| Llama generation timeout (>120s) | Show error "MOM generation timed out. Please try again or type the MOM manually." |
| ChromaDB embedding fails | Queue retry via Celery, do not block MOM publishing |
| Email sending fails | Log failure, retry 3x via Celery, mark notification as FAILED in DB |
| WebSocket drops during live transcription | Auto-reconnect once, then show "Transcription disconnected. Click to reconnect." |
| File upload exceeds 50MB | Show error before upload starts: "File too large. Maximum size is 50MB." |

---

## 7. ACCEPTANCE CRITERIA SUMMARY

The platform is considered working when every item below passes:

### Auth
- [ ] User registers with new email → account created
- [ ] User logs in → JWT returned and stored in frontend
- [ ] Protected route accessed without token → 401 returned
- [ ] Admin promotes user to Organizer → new role takes effect immediately

### Community & Groups
- [ ] Admin creates community → appears in dashboard
- [ ] Admin adds member to community → member can see community
- [ ] Organizer creates group → group appears under community

### Meeting Lifecycle
- [ ] Organizer creates meeting in DRAFT → not visible to invitees
- [ ] Organizer sends invitations → meeting moves to PUBLISHED, emails sent
- [ ] Invitee clicks RSVP link in email → RSVP recorded without login (external)
- [ ] Agenda built and shared → participants receive agenda email
- [ ] Organizer starts meeting → status moves to LIVE
- [ ] Attendance marked during live meeting → persists
- [ ] Decision logged during live meeting → appears in MOM
- [ ] Live transcription started → transcript appears within 5 seconds
- [ ] Hindi audio uploaded → Whisper transcribes, language detected as HI, translated to EN
- [ ] "Generate MOM" clicked → all 8 MOM sections generated
- [ ] Quality check warnings shown in MOM review screen
- [ ] MOM approved → published, distribution emails sent to all attendees
- [ ] MOM downloadable as PDF

### Action Items
- [ ] Action items extracted from MOM automatically
- [ ] Participant updates status of their own action item
- [ ] Overdue action item → reminder email sent to assignee and organizer

### Search
- [ ] Natural language query returns relevant past meeting
- [ ] Search scoped to user's accessible meetings

### Admin
- [ ] Admin views all meetings platform-wide
- [ ] Admin cancels a meeting → cancellation email sent
- [ ] System health screen shows correct status of Ollama, Whisper, Redis, Celery

---

## 8. OUT OF SCOPE (DO NOT BUILD)

- Real-time video/audio conferencing (the platform schedules and documents meetings — it does not host them)
- Mobile native app (web-responsive only)
- Payments or subscriptions
- Public-facing community pages
- Integration with Google Calendar, Outlook, or Zoom (future phase)
- GDPR data export/deletion tools (future phase)

---

*This PRD is the source of truth. Any feature not described here is out of scope for this version. Any feature described here must work exactly as specified.*

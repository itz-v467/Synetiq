# Frontend Architecture & UI Specification
## AI Powered Community Meeting Management Platform

Version: 1.0  
Status: Frontend Planning Phase

---

# 1. FRONTEND VISION

The frontend must feel like a modern AI powered operational workspace rather than a traditional CRUD dashboard.

The platform should combine:
- Enterprise meeting management
- AI assisted workflows
- Real time collaboration
- Operational intelligence
- Institutional knowledge management

The experience should feel similar to:
- Linear
- Notion
- Slack
- ClickUp
- Granola AI
- Fireflies AI

The UI must remain:
- Minimal
- Fast
- Dense but readable
- Highly responsive
- Keyboard friendly
- Real time

---

# 2. DESIGN PRINCIPLES

## 2.1 AI First Experience

AI is not a hidden backend utility.

AI interactions must be visible throughout the interface:
- AI suggestions
- AI insights
- AI status indicators
- AI generation progress
- AI quality checks
- AI operational monitoring

---

## 2.2 Workspace Driven Layout

The UI should feel like a workspace instead of separate disconnected pages.

Structure:
- Persistent sidebar
- Global navbar
- Dynamic main workspace
- Optional right context panel

---

## 2.3 Real Time Feel

The application must feel alive.

Use:
- Live updates
- Streaming text
- Realtime counters
- Presence indicators
- Status animations
- Live logs
- Instant sync

---

## 2.4 Information Hierarchy

Primary information should always be visible first:
1. Meeting status
2. Action required
3. AI insights
4. Collaboration data
5. Historical data

---

# 3. DESIGN SYSTEM

## 3.1 Theme

### Primary Style
Dark modern workspace UI.

### Background
- Neutral dark surfaces
- Soft contrast layers
- Minimal gradients

### Accent Colours
Recommended:
- Electric blue
- Soft violet
- Cyan highlights

### Status Colours
- Success → Green
- Warning → Amber
- Error → Red
- AI Active → Purple/Cyan glow

---

## 3.2 Typography

### Primary Fonts
- Inter
- Geist
- Satoshi

### Typography Scale
- Hero: 32px
- Section Title: 24px
- Card Title: 18px
- Body: 14px to 16px
- Caption: 12px

---

## 3.3 UI Components

Core reusable components:
- Sidebar
- Navbar
- Command palette
- Cards
- Modals
- Drawers
- Data tables
- Kanban boards
- Timeline
- Activity feed
- Rich text editor
- AI status indicators
- Toast notifications
- Realtime transcript stream
- Charts
- Multi step loaders

---

# 4. APPLICATION LAYOUT

## 4.1 Global Layout Structure

```txt
┌──────────────────────────────────────────┐
│ Navbar                                  │
├──────────────┬───────────────────────────┤
│ Sidebar      │ Main Workspace           │
│              │                           │
│              │                           │
│              │                           │
├──────────────┴───────────────────────────┤
│ Optional Bottom Status Bar              │
└──────────────────────────────────────────┘
```

---

## 4.2 Navbar

### Left Section
- Current page title
- Breadcrumb navigation
- Community selector

Example:
```txt
Community > IEEE SB > Core Team
```

---

### Centre Section

#### Global Semantic Search

Placeholder:
```txt
Search meetings, MOMs, action items...
```

Capabilities:
- Natural language search
- Recent searches
- Quick navigation
- AI semantic retrieval
- Keyboard shortcut support

Shortcut:
```txt
Ctrl + K
```

---

### Right Section

Components:
- Notification bell
- AI status indicator
- Quick create menu
- User profile menu

---

## AI Status Indicator

Displays:
- Ollama status
- Whisper status
- Transcription status
- Queue health

States:
- Online
- Processing
- Offline
- Degraded

---

## 4.3 Sidebar

### Primary Navigation Items

#### Dashboard
Overview and analytics.

#### Meetings
Subsections:
- Draft
- Published
- Live
- Ended
- Archived

#### MOM Repository
Subsections:
- Drafts
- Published
- AI flagged
- Recent

#### Action Items
Subsections:
- Assigned to me
- Overdue
- Completed
- By group

#### Communities
Expandable tree structure.

Example:
```txt
IEEE SB
 ├ Core Team
 ├ Design Team
 └ Events Team
```

#### Analytics

#### AI Operations

#### Admin Panel

#### Settings

---

# 5. CORE PAGES

## 5.1 Dashboard

### Purpose
Provide operational overview and AI insights.

---

### Sections

#### Hero Statistics
Cards:
- Meetings today
- Pending approvals
- Action items due
- Attendance rate

---

#### AI Insights Panel

Examples:
```txt
Attendance dropped 12% this month.
3 action items are overdue.
Most discussed topic this week: Sponsorship.
```

---

#### Upcoming Meetings Timeline

Each card includes:
- Title
- Time
- RSVP percentage
- Meeting readiness
- AI enabled status

---

#### Recent MOM Activity

Cards showing:
- Recently generated MOMs
- Approval pending
- Quality score
- Unread MOMs

---

#### Analytics Section

Charts:
- Attendance trend
- RSVP trend
- Completion rate
- Meeting frequency
- MOM generation time

---

## 5.2 Meetings Page

### Meeting Table Columns
- Title
- Organizer
- Status
- RSVP %
- Date
- AI readiness
- Transcription enabled

---

### Filters
- Status
- Group
- Organizer
- Date range

---

### Actions
- Create meeting
- Duplicate meeting
- Archive meeting
- Export meeting

---

## 5.3 Meeting Detail Page

### Tabs

#### Overview
Displays:
- Metadata
- Description
- Timeline
- Meeting status

---

#### Agenda Builder

Features:
- Drag reorder
- Inline editing
- Duration tracking
- File attachments
- AI generated agenda suggestions

---

#### Invitees

Features:
- RSVP status pills
- Attendance predictions
- External invite handling
- Resend invitation

---

#### Live Meeting

Main operational screen.

---

## 5.4 Live Meeting Interface

### Layout Structure

```txt
┌─────────────┬──────────────────┬──────────────┐
│ Agenda      │ Transcript       │ Quick Actions│
│ Checklist   │ Stream           │ Panel        │
└─────────────┴──────────────────┴──────────────┘
```

---

### Agenda Panel
- Agenda checklist
- Time allocation
- Timer tracking
- Completion indicators

---

### Transcript Panel

Features:
- Live streaming transcript
- Speaker identification
- Language badges
- Translation blocks
- Editable transcript
- Timestamp markers

---

### Quick Actions Panel

Buttons:
- Log decision
- Add action item
- Mark attendance
- AI summary snapshot

---

### Bottom Controls
- Start transcription
- Pause transcription
- End meeting
- Export notes

---

## 5.5 MOM Review Page

### Layout

#### Left Side
Rich text editor.

#### Right Side
AI quality analysis panel.

---

### Quality Panel

Displays:
- Missing agenda coverage
- Missing deadlines
- Vague decisions
- Incomplete action items

---

### Top Actions
- Approve
- Regenerate
- Export PDF
- Compare versions
- Share MOM

---

## 5.6 MOM Viewer

### Purpose
Professional read only document view.

Style inspiration:
- Google Docs
- Confluence
- Notion export

---

### Features
- Print friendly
- Export support
- Read receipts
- Version history
- Linked action items

---

## 5.7 Action Items Page

### Available Views

#### Table View
Enterprise management style.

#### Kanban View
Columns:
- OPEN
- IN_PROGRESS
- DONE
- DEFERRED

#### Calendar View
Deadline based planning.

---

### Filters
- Assignee
- Status
- Due date
- Meeting
- Group
- Overdue only

---

### Action Item Drawer

Displays:
- Linked meeting
- Linked MOM
- Comments
- Activity timeline
- AI generated context

---

## 5.8 Analytics Page

### Charts Required
- Attendance trend
- RSVP trend
- Meeting frequency
- Completion rate
- MOM generation time
- Community engagement

---

### AI Digest Section

Displays AI generated weekly operational summary.

---

## 5.9 Admin Panel

### Sections

#### User Management
Table with:
- Roles
- Communities
- Status
- Last active

---

#### Meeting Oversight
Global meeting control.

---

#### System Health Monitor

Cards for:
- Ollama
- Whisper
- PostgreSQL
- Redis
- Celery
- ChromaDB

Each card shows:
- Current status
- Last checked time
- Response time
- Queue status

---

## 5.10 AI Operations Page

### Purpose
AI operational monitoring.

---

### Sections
- Active transcription jobs
- MOM generation queue
- Embedding queue
- Failed jobs
- AI logs
- Retry operations
- Model usage statistics

---

# 6. UX REQUIREMENTS

## 6.1 Command Palette

Shortcut:
```txt
Ctrl + K
```

Supports:
- Global navigation
- Search
- Quick actions
- AI commands

---

## 6.2 Keyboard Shortcuts

Examples:
- N → New meeting
- G → Open groups
- M → Open meetings
- / → Focus search

---

## 6.3 Loading States

Never use plain spinners.

Use contextual AI loaders:
```txt
Generating MOM...
Analysing transcript...
Embedding into semantic memory...
Running quality checks...
```

---

## 6.4 Empty States

Every empty state should guide the user.

Example:
```txt
No meetings scheduled yet.
Create your first meeting to get started.
```

---

## 6.5 Notifications

Notification types:
- RSVP updates
- MOM approvals
- Meeting reminders
- Action item alerts
- AI failures

---

# 7. RESPONSIVENESS

## Desktop First
Primary usage is desktop.

---

## Tablet Support
Fully supported.

---

## Mobile Support
Responsive viewing only.
Limited editing capability.

---

# 8. FRONTEND TECH STACK

## Framework
Next.js 15

---

## Language
TypeScript

---

## Styling
Tailwind CSS

---

## UI Components
shadcn/ui

---

## State Management
Zustand

---

## Data Fetching
TanStack Query

---

## Forms
React Hook Form + Zod

---

## Charts
Recharts

---

## Rich Text Editor
TipTap

---

## Realtime
Socket.IO

---

## Drag & Drop
dnd-kit

---

## Animations
Framer Motion

---

# 9. PERFORMANCE REQUIREMENTS

- Initial dashboard load under 2 seconds
- Live transcript latency under 5 seconds
- Smooth page transitions
- Optimistic UI updates where possible
- Virtualized large tables
- Lazy loaded analytics modules

---

# 10. ACCESSIBILITY

- Keyboard navigable
- ARIA labels
- Proper contrast ratios
- Screen reader support
- Focus visibility

---

# 11. FUTURE READY UI CONSIDERATIONS

Frontend architecture must support:
- Multi tenant scaling
- AI assistant chat
- Voice commands
- Video integrations
- Mobile app
- Collaborative editing
- Real time co presence

---

# 12. PRODUCT POSITIONING

This platform must visually communicate:
- AI assisted operations
- Meeting intelligence
- Community coordination
- Institutional memory
- Execution tracking

The UI should never feel like:
```txt
Simple MOM Generator
```

The UI should feel like:
```txt
AI Powered Community Operations Platform
```
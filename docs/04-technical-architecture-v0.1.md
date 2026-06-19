# The Lawrence Loop

## Technical Architecture v0.1

## 1. Architecture Summary

The Lawrence Loop is a private, mobile-first Progressive Web App designed to help the Lawrence family manage family logistics, preparation, responsibility and car/resource clashes.

The recommended architecture is:

> A local-first PWA with structured client-side storage, deterministic conflict detection, JSON backup/restore, offline operation, and a future-ready path to authenticated multi-user sync.

The first version should not require a backend. It should be installable on iPhone, fast to open, usable offline, and capable of safe data export.

Future versions may add cloud sync, shared Phil and Beck access, push notifications, calendar import and AI-assisted review, but these should not complicate the MVP.

---

## 2. Core Architecture Decision

## 2.1 Recommended v1 architecture

Use a **frontend-only local-first PWA**.

Recommended stack:

- React
    
- TypeScript
    
- Vite
    
- Local IndexedDB storage
    
- Dexie or equivalent IndexedDB wrapper
    
- Service worker for offline shell and asset caching
    
- JSON import/export for backup and migration
    
- Deterministic in-browser rules engine for conflicts and reminders
    

## 2.2 Why this is the right starting point

This app will hold sensitive family logistics, including child activities, appointments, travel, work movements and pet care. A local-first model gives immediate privacy, avoids backend complexity, and allows the product to prove its usefulness before introducing sync.

The first build should optimise for:

- Fast mobile use
    
- Private data
    
- Low operating cost
    
- Simple deployment
    
- Offline resilience
    
- Safe export
    
- Controlled complexity
    

## 2.3 What this deliberately avoids

The MVP should avoid:

- Backend authentication
    
- Cloud database complexity
    
- Real-time multi-user sync
    
- Payment infrastructure
    
- Push notification server
    
- Calendar API integration
    
- AI scheduling
    
- Account management
    
- Complex permissions
    

These are future options, not v1 foundations.

---

## 3. High-Level System Architecture

## 3.1 Logical architecture

The app should be structured as five main layers:

1. Presentation layer
    
2. Application workflow layer
    
3. Domain logic layer
    
4. Local data layer
    
5. PWA platform layer
    

## 3.2 Layer responsibilities

### Presentation layer

Responsible for:

- Screens
    
- Navigation
    
- Forms
    
- Cards
    
- Badges
    
- Calendar views
    
- Responsive layout
    
- User interaction
    

This layer should not contain business rules.

### Application workflow layer

Responsible for:

- Create event flow
    
- Edit event flow
    
- Template-based creation
    
- Recurring event management
    
- Import/export workflows
    
- Conflict resolution workflow
    
- Weekly review workflow
    

This layer coordinates user actions and domain logic.

### Domain logic layer

Responsible for:

- Event validation
    
- Recurrence expansion
    
- Car conflict detection
    
- Responsibility conflict detection
    
- Prep overdue detection
    
- Reminder generation
    
- Dashboard summary generation
    
- Date and time calculations
    

This layer should be deterministic and testable.

### Local data layer

Responsible for:

- IndexedDB schema
    
- CRUD operations
    
- Local migrations
    
- Data versioning
    
- Import validation
    
- Export generation
    
- Backup metadata
    

This layer should isolate storage decisions from the rest of the app.

### PWA platform layer

Responsible for:

- Web app manifest
    
- Service worker
    
- Offline app shell
    
- Asset caching
    
- Installability
    
- Future notification registration
    
- Cache invalidation strategy
    

---

## 4. Proposed Technical Stack

## 4.1 Frontend framework

Recommended:

- React
    
- TypeScript
    
- Vite
    

Rationale:

- Strong component model
    
- Good support for mobile-first PWAs
    
- Fast development and build process
    
- Mature ecosystem
    
- Clean fit for local-first client applications
    

## 4.2 Styling

Recommended:

- Tailwind CSS
    
- Small reusable component system
    
- CSS variables for theme tokens
    

Design tokens should include:

- Background colour
    
- Card colour
    
- Text colour
    
- Accent colour
    
- Warning colour
    
- Critical colour
    
- Person colours
    
- Border radius
    
- Spacing scale
    

The design should be warm and calm, not corporate and not childish.

## 4.3 Routing

Recommended:

- Client-side routing
    
- Simple URL routes for main views
    

Suggested routes:

```text
/
 /today
 /week
 /calendar
 /car
 /prep
 /people
 /people/:memberId
 /routines
 /templates
 /places
 /settings
 /settings/import
 /settings/export
```

## 4.4 State management

Recommended:

- React state for local component state
    
- Context or lightweight store for app-level UI state
    
- Data fetched from local repository layer
    
- Derived state calculated through selectors
    

Avoid heavy state frameworks until needed.

## 4.5 Local database

Recommended:

- IndexedDB
    
- Dexie or equivalent wrapper
    

IndexedDB is better suited than localStorage because the app will need structured records, indexes, migrations and reliable handling of larger JSON datasets.

## 4.6 Date handling

Recommended:

- Use native date handling carefully
    
- Add a small date utility library only if needed
    
- Store all date-times as ISO strings with timezone awareness
    
- Treat Europe/London as the household default timezone
    

The app must handle:

- All-day events
    
- Timed events
    
- Recurring events
    
- Day/week/month views
    
- British daylight saving changes
    
- Relative reminder dates
    

## 4.7 Validation

Recommended:

- Runtime schema validation for import/export
    
- Form-level validation for user entry
    
- Data-level validation before writes
    

A schema validation library such as Zod would be suitable if using TypeScript.

---

## 5. Deployment Model

## 5.1 MVP deployment

Recommended deployment options:

- Static hosting
    
- GitHub Pages
    
- Cloudflare Pages
    
- Netlify
    
- Vercel
    
- Oracle Cloud Infrastructure static hosting, if preferred later
    

The app should be deployable as static files.

## 5.2 Why static hosting is enough

The MVP has no backend dependency. The browser stores the family data locally. Static hosting only serves the application shell, JavaScript, CSS, icons and manifest.

## 5.3 Privacy implication

Static hosting does not store the family schedule if the app is local-first. The schedule remains in browser storage unless the user explicitly exports it or a later sync feature is added.

---

## 6. PWA Architecture

## 6.1 Web app manifest

The app should include a valid manifest with:

- App name
    
- Short name
    
- Start URL
    
- Scope
    
- Display mode
    
- Theme colour
    
- Background colour
    
- Icons
    
- Description
    

Suggested app identity:

```json
{
  "name": "The Lawrence Loop",
  "short_name": "Lawrence Loop",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "theme_color": "#f7efe2",
  "background_color": "#f7efe2"
}
```

## 6.2 Installability

The app should be installable to the iPhone home screen.

Installability requirements:

- Valid manifest
    
- Suitable icons
    
- HTTPS hosting
    
- Service worker
    
- Responsive layout
    
- Offline-capable app shell
    

## 6.3 Service worker

The service worker should provide:

- Offline app shell
    
- Static asset caching
    
- Runtime fallback for navigation
    
- Cache versioning
    
- Safe update behaviour
    

## 6.4 Offline behaviour

The app should work offline for:

- Dashboard
    
- Today view
    
- Week view
    
- Existing events
    
- Existing prep tasks
    
- Existing places
    
- Existing routines
    
- Local data editing
    

Offline mode should not feel exceptional. It should be the default assumption.

## 6.5 Cache strategy

Recommended strategies:

### App shell

Use cache-first with versioned assets.

### HTML navigation fallback

Use network-first with fallback to cached app shell.

### Local data

Do not cache family data through the service worker. Store family data in IndexedDB.

### Icons and static assets

Use cache-first.

## 6.6 Update strategy

The app should detect when a new version is available and offer a gentle update prompt.

Suggested behaviour:

- New version detected.
    
- User sees “Update available”.
    
- User taps update.
    
- App reloads safely.
    

Avoid surprise reloads while the user is editing family data.

---

## 7. Data Architecture

## 7.1 Database name

Suggested database name:

```text
lawrence_loop_db
```

## 7.2 Schema versioning

The database should use explicit schema versions.

Example:

```text
schemaVersion: 1
appDataVersion: "lawrence-loop-data-v1"
```

This is important for safe future migration.

## 7.3 Core tables

Recommended IndexedDB stores:

```text
households
familyMembers
resources
places
events
eventSeries
templates
settings
auditLog
```

Prep tasks, reminders and resource needs may be embedded inside events for MVP simplicity.

## 7.4 Embedded versus separate records

### Embed inside Event for MVP

- Resource needs
    
- Prep tasks
    
- Reminders
    

Rationale:

- They usually belong to a single event.
    
- Simpler import/export.
    
- Simpler event editing.
    
- Lower risk of orphaned records.
    

### Separate top-level records later if needed

- Prep tasks
    
- Reminders
    
- Conflicts
    

Rationale for later separation:

- If prep tasks need cross-event workflows.
    
- If reminders require notification scheduling.
    
- If conflicts need persistent resolution history.
    

## 7.5 Event record shape

Recommended v1 event shape:

```json
{
  "id": "event_001",
  "title": "Seb swimming",
  "category": "lesson",
  "status": "confirmed",
  "startAt": "2026-06-24T17:30:00+01:00",
  "endAt": "2026-06-24T18:00:00+01:00",
  "allDay": false,
  "placeId": "place_lichfield_leisure_centre",
  "participants": ["member_seb"],
  "responsibleAdults": ["member_phil"],
  "resourceNeeds": [
    {
      "resourceId": "resource_family_car",
      "needStatus": "required",
      "neededFrom": "2026-06-24T17:00:00+01:00",
      "neededUntil": "2026-06-24T18:25:00+01:00",
      "allocatedTo": "member_phil",
      "notes": ""
    }
  ],
  "prepTasks": [
    {
      "id": "task_001",
      "title": "Pack swimming kit",
      "owner": "member_phil",
      "dueAt": "2026-06-24T16:30:00+01:00",
      "priority": "critical",
      "status": "open",
      "blocksEvent": true,
      "notes": ""
    }
  ],
  "reminders": [
    {
      "id": "reminder_001",
      "audience": ["member_phil"],
      "trigger": "same_day_morning",
      "reason": "Swimming kit needed",
      "condition": "prep_tasks_open"
    }
  ],
  "seriesId": "series_seb_swimming",
  "templateId": "template_swimming_lesson",
  "notes": "",
  "createdAt": "2026-06-16T12:00:00+01:00",
  "updatedAt": "2026-06-16T12:00:00+01:00"
}
```

## 7.6 ID strategy

Use stable string IDs.

Recommended patterns:

```text
member_phil
member_beck
member_seb
member_albert
resource_family_car
event_<uuid>
series_<uuid>
place_<uuid>
template_<slug>
```

Avoid numeric IDs because JSON exports are easier to understand and merge with string identifiers.

## 7.7 Audit trail

MVP should include a lightweight audit log.

Purpose:

- Help debug imports.
    
- Track accidental changes.
    
- Support future undo/restore.
    

Suggested audit event fields:

```json
{
  "id": "audit_001",
  "entityType": "event",
  "entityId": "event_001",
  "action": "created",
  "timestamp": "2026-06-16T12:00:00+01:00",
  "summary": "Created Seb swimming"
}
```

The audit log should be simple and local only.

---

## 8. Domain Logic Architecture

## 8.1 Domain services

Create dedicated services for business logic.

Suggested services:

```text
eventService
seriesService
templateService
dashboardService
conflictService
reminderService
prepService
resourceService
importExportService
validationService
```

## 8.2 Why services matter

The app should not bury logic inside React components. Conflict detection, recurring event expansion and reminder calculation should be testable without rendering the UI.

---

## 9. Recurrence Architecture

## 9.1 Event series model

Recurring events should be stored as event series, not copied indefinitely.

The app can generate visible occurrences for the selected date range.

## 9.2 Occurrence generation

The app should generate occurrences for:

- Today
    
- Current week
    
- Current month
    
- Next 30 or 60 days for dashboard planning
    

Do not generate years of occurrences unnecessarily.

## 9.3 Exceptions

The model must support exceptions.

Exception types:

- Cancelled occurrence
    
- Moved occurrence
    
- Changed responsible adult
    
- Changed location
    
- Changed prep tasks
    
- Changed car need
    

## 9.4 Generated versus materialised events

Recommended MVP approach:

- Store the series.
    
- Generate occurrences for display.
    
- Materialise an occurrence only when it is edited, completed or given custom prep/status.
    

This avoids large duplicated datasets.

---

## 10. Conflict Detection Architecture

## 10.1 Conflict calculation

Conflicts should be calculated by the domain layer.

Inputs:

- Events
    
- Generated recurring occurrences
    
- Resource needs
    
- Responsible adults
    
- Places
    
- Prep tasks
    
- Travel time assumptions
    

Outputs:

- Conflict objects for display
    

## 10.2 Initial conflict rules

### Car conflict

Detect when two events need the same car during overlapping resource windows.

### Responsibility conflict

Detect when one adult is responsible for overlapping or impractical events.

### Unassigned responsibility

Detect events involving Seb or Albert where no adult is responsible.

### Prep overdue

Detect open prep tasks past their due date.

### Tight travel gap

Detect events with insufficient time between locations.

### Albert care gap

Detect long periods where both adults are away and Albert is not accounted for.

## 10.3 Conflict persistence

Recommended MVP approach:

- Calculate conflicts live.
    
- Store only acknowledgement/resolution state if needed.
    

This avoids stale conflict records when events change.

## 10.4 Conflict severity

Use three levels:

```text
info
warning
critical
```

Suggested mapping:

- Critical: two required car needs overlap.
    
- Warning: required and maybe car needs overlap.
    
- Warning: critical prep task overdue.
    
- Info: travel gap worth checking.
    
- Warning: Seb or Albert event has no responsible adult.
    

---

## 11. Reminder Architecture

## 11.1 MVP reminder model

MVP reminders should appear inside the app.

Surfaces:

- Dashboard
    
- Today view
    
- Prep view
    
- Event detail
    

Do not make push notifications a mandatory MVP dependency.

## 11.2 Reminder calculation

Reminder service should calculate due reminders based on:

- Current date/time
    
- Event start
    
- Prep task due dates
    
- Reminder trigger
    
- Reminder condition
    
- Dismissed status
    

## 11.3 Future notification path

A future version may use browser notification capabilities.

Future requirements would include:

- Permission prompt
    
- Notification settings
    
- Service worker notification handling
    
- Push subscription if server-driven notifications are needed
    
- Backend or notification service for true push
    

MVP should prepare the data model but not require notification infrastructure.

---

## 12. Import and Export Architecture

## 12.1 Export format

Use a versioned JSON export.

Suggested top-level shape:

```json
{
  "schema": "lawrence-loop-data-v1",
  "exportedAt": "2026-06-16T12:00:00+01:00",
  "appVersion": "0.1.0",
  "household": {},
  "familyMembers": [],
  "resources": [],
  "places": [],
  "templates": [],
  "eventSeries": [],
  "events": [],
  "settings": {}
}
```

## 12.2 Export behaviour

The export should:

- Download as JSON.
    
- Include all local family data.
    
- Exclude transient UI state.
    
- Include schema version.
    
- Include export timestamp.
    

Suggested filename:

```text
lawrence-loop-backup-YYYY-MM-DD.json
```

## 12.3 Import behaviour

Import must have three stages:

1. Select or paste JSON.
    
2. Preview and validate.
    
3. Commit import.
    

The app should never silently overwrite live data.

## 12.4 Import modes

Recommended modes:

### Restore mode

Replaces all current local data after explicit confirmation.

### Merge mode

Future option. Not needed for MVP.

### Seed mode

Adds starter templates and default family records. Useful during first setup.

## 12.5 Import validation

Validation should check:

- Schema name
    
- Schema version
    
- Required arrays
    
- Required fields
    
- Duplicate IDs
    
- Broken references
    
- Invalid dates
    
- Unknown categories
    
- Missing household
    
- Invalid member references
    
- Invalid resource references
    

## 12.6 Bad import handling

Bad imports should produce human-readable errors.

Example:

```text
Import blocked. Event "Seb swimming" references missing placeId "place_lichfield_leisure_centre".
```

---

## 13. Privacy and Security Architecture

## 13.1 Data sensitivity

The app may contain:

- Child routines
    
- School and club locations
    
- Health appointments
    
- Vet appointments
    
- Work travel
    
- Household patterns
    
- Travel plans
    

Treat all local data as sensitive.

## 13.2 MVP privacy controls

Recommended:

- Local-first storage
    
- No analytics
    
- No external telemetry
    
- No third-party data submission
    
- No account required
    
- Manual JSON export only
    
- Clear warning that exports contain private family data
    

## 13.3 Local device risk

Local-first does not mean risk-free.

Risks:

- Device loss
    
- Shared device access
    
- Browser data deletion
    
- Accidental export sharing
    

Mitigations:

- Optional app lock in future
    
- Regular backup reminders
    
- Export warning
    
- No sensitive medical details by default
    
- Keep notes practical and minimal
    

## 13.4 Future authentication

If sync is added later, use:

- Individual accounts for Phil and Beck
    
- Household membership
    
- Role-based access if Seb view is added
    
- Server-side encryption at rest where possible
    
- Strong backup and export controls
    

---

## 14. UI Architecture

## 14.1 Screen structure

Recommended main navigation:

```text
Dashboard
Today
Week
Calendar
Car
Prep
People
Routines
Settings
```

Settings can contain:

```text
Family
Places
Templates
Import
Export
Reset
About
```

## 14.2 Mobile-first layout

The main experience should be optimised for:

- iPhone screen width
    
- Thumb-friendly controls
    
- Fast scanning
    
- Clear badges
    
- Minimal typing
    
- Large tap targets
    
- Sticky quick add button
    

## 14.3 Desktop/tablet layout

Larger screens should enhance the same product, not become a different product.

Desktop/tablet can show:

- Wider weekly view
    
- Multi-column dashboard
    
- Side navigation
    
- Larger calendar grid
    
- Easier data management
    

## 14.4 Component model

Suggested component groups:

```text
layout/
  AppShell
  BottomNav
  Header
  PageContainer

cards/
  EventCard
  PrepTaskCard
  ConflictCard
  CarNeedCard
  PersonSummaryCard

forms/
  EventForm
  PlaceForm
  SeriesForm
  TemplateForm
  ImportForm

calendar/
  DayTimeline
  WeekStrip
  MonthGrid
  EventPill

badges/
  PersonBadge
  CategoryBadge
  CarBadge
  PrepBadge
  ConflictBadge
```

---

## 15. Dashboard Architecture

## 15.1 Dashboard inputs

Dashboard service should consume:

- Today’s events
    
- Tomorrow’s events
    
- Next 7 days of events
    
- Open prep tasks
    
- Generated conflicts
    
- Upcoming resource needs
    
- Reminder calculations
    

## 15.2 Dashboard outputs

Dashboard should produce grouped sections:

```text
Today
Needs attention
Car watch
Prep due
Coming up
```

## 15.3 Dashboard priority logic

Suggested order:

1. Critical conflicts
    
2. Overdue critical prep
    
3. Today’s events
    
4. Today’s car needs
    
5. Tomorrow’s prep
    
6. Upcoming unusual events
    
7. Normal routine events
    

---

## 16. Data Flow

## 16.1 Event creation flow

```text
User action
  -> Event form
  -> Validation service
  -> Template service, if template used
  -> Event service
  -> Local repository
  -> Conflict recalculation
  -> Dashboard refresh
```

## 16.2 Dashboard load flow

```text
App opens
  -> Load local settings
  -> Load family data
  -> Expand recurring series for visible range
  -> Calculate prep status
  -> Calculate reminders
  -> Calculate conflicts
  -> Render dashboard
```

## 16.3 Import flow

```text
User selects JSON
  -> Parse JSON
  -> Validate schema
  -> Validate references
  -> Produce preview
  -> User confirms
  -> Backup current data internally if possible
  -> Commit imported data
  -> Recalculate dashboard
```

---

## 17. Testing Architecture

## 17.1 Unit tests

Priority unit tests:

- Date range overlap
    
- Resource overlap
    
- Car conflict detection
    
- Prep overdue detection
    
- Recurrence expansion
    
- Exception handling
    
- Import validation
    
- Export generation
    

## 17.2 Integration tests

Priority integration tests:

- Create event from template
    
- Create recurring series
    
- Edit recurring occurrence
    
- Import valid backup
    
- Reject invalid backup
    
- Detect car clash
    
- Resolve or acknowledge clash
    
- Complete prep task
    

## 17.3 Manual mobile tests

Priority manual checks:

- Add to iPhone home screen
    
- Launch from home screen
    
- Offline launch
    
- Add event offline
    
- Export JSON
    
- Import JSON
    
- Rotate device
    
- Use with large text setting
    
- Use with low signal
    

---

## 18. Performance Architecture

## 18.1 Performance targets

The app should feel instant.

Targets:

- App shell loads quickly after first install.
    
- Dashboard renders without visible delay.
    
- Event creation does not feel heavy.
    
- Local search feels immediate.
    
- Week view remains smooth.
    

## 18.2 Performance strategy

Recommended:

- Local IndexedDB indexes
    
- Load visible date range first
    
- Generate recurrence only for needed windows
    
- Memoise dashboard calculations
    
- Avoid large calendar renders
    
- Keep templates lightweight
    
- Avoid unnecessary background work
    

---

## 19. Accessibility Architecture

## 19.1 Minimum accessibility expectations

The app should support:

- Keyboard navigation where practical
    
- Screen reader labels
    
- Sufficient colour contrast
    
- Large tap targets
    
- Clear focus states
    
- Non-colour-only warning indicators
    
- Dynamic text tolerance
    

## 19.2 Family usability

The app should be readable under rushed conditions.

Design implications:

- Plain English warnings
    
- Clear event ownership
    
- No tiny controls
    
- Avoid dense month view as the main interface
    
- Strong Today and Prep views
    

---

## 20. Configuration Architecture

## 20.1 Settings

Settings should include:

- Household name
    
- Family members
    
- Family car/resource
    
- Places
    
- Templates
    
- Categories
    
- Default reminder preferences
    
- Export data
    
- Import data
    
- Reset data
    

## 20.2 Preloaded defaults

On first launch, the app should offer a starter setup for:

- Phil
    
- Beck
    
- Seb
    
- Albert
    
- Family car
    
- Core templates
    
- Core categories
    

This reduces setup friction.

---

## 21. Future Sync Architecture

## 21.1 Why sync is not MVP

True multi-user sync introduces:

- Authentication
    
- Authorisation
    
- Conflict resolution
    
- Server storage
    
- Network error handling
    
- Data protection obligations
    
- Notification infrastructure
    

MVP should prove the product first.

## 21.2 Future sync model

A future backend could add:

- Household account
    
- Phil and Beck user accounts
    
- Shared encrypted database
    
- Sync queue
    
- Last-write or field-level conflict resolution
    
- Device registration
    
- Push notifications
    
- Calendar integration
    

## 21.3 Sync-ready design choices now

To avoid future rework:

- Use stable IDs.
    
- Include `createdAt` and `updatedAt`.
    
- Avoid browser-only assumptions in domain logic.
    
- Keep repository layer abstracted.
    
- Use schema versions.
    
- Keep import/export clean.
    
- Avoid direct IndexedDB calls from UI components.
    

---

## 22. Future Calendar Integration

## 22.1 Not recommended for MVP

Calendar sync sounds useful but risks turning the app into a generic calendar too early.

## 22.2 Better future approach

Treat external calendar integration as import/context, not the primary source of truth.

Possible future modes:

- Import selected iCal feeds.
    
- Read-only display of external calendars.
    
- Convert external event into Lawrence Loop event.
    
- Export selected events to family calendar.
    

## 22.3 Why this matters

External calendar events often lack:

- Prep tasks
    
- Car needs
    
- Responsible adult
    
- Family-specific context
    
- Conflict resolution state
    

The Lawrence Loop should remain the logistics layer.

---

## 23. Future AI Architecture

## 23.1 AI is not required for MVP

The core product should work without AI.

## 23.2 Sensible future AI use cases

Future AI could support:

- “What are we forgetting this week?”
    
- Natural language event creation
    
- Birthday party checklist suggestions
    
- Baby Group block creation from pasted text
    
- Weekly planning summary
    
- Clash explanation
    
- Holiday mode planning
    
- Linkage with Properly Packed
    

## 23.3 AI safety boundary

Do not send private family data to an AI service unless:

- The user explicitly requests it.
    
- The data being sent is clearly shown.
    
- There is a privacy-conscious architecture.
    
- The app can still function without AI.
    

---

## 24. Folder Structure

Suggested project structure:

```text
lawrence-loop/
  public/
    icons/
    manifest.webmanifest

  src/
    app/
      App.tsx
      routes.tsx
      AppShell.tsx

    components/
      layout/
      cards/
      forms/
      calendar/
      badges/
      common/

    data/
      db.ts
      repositories/
      migrations/
      seedData/

    domain/
      events/
      series/
      templates/
      conflicts/
      reminders/
      prep/
      resources/
      dashboard/
      validation/

    pages/
      DashboardPage.tsx
      TodayPage.tsx
      WeekPage.tsx
      CalendarPage.tsx
      CarPage.tsx
      PrepPage.tsx
      PeoplePage.tsx
      PersonDetailPage.tsx
      RoutinesPage.tsx
      SettingsPage.tsx

    types/
      domain.ts
      importExport.ts

    utils/
      dates.ts
      ids.ts
      formatting.ts

    styles/
      tokens.css
      globals.css

  tests/
    unit/
    integration/

  package.json
  vite.config.ts
  tsconfig.json
```

---

## 25. Build Phases

## 25.1 Phase 1, foundation

Deliver:

- Project scaffold
    
- PWA manifest
    
- App shell
    
- Navigation
    
- Theme
    
- Local database setup
    
- Seed family members
    
- Seed categories
    
- Seed family car
    

## 25.2 Phase 2, core events

Deliver:

- Event model
    
- Add/edit/delete event
    
- Place selection
    
- Participants
    
- Responsible adult
    
- Car need
    
- Prep tasks
    
- Today view
    

## 25.3 Phase 3, dashboard and prep

Deliver:

- Dashboard
    
- Prep view
    
- Overdue prep logic
    
- Event cards
    
- Reminder surfacing
    
- Quick completion of prep tasks
    

## 25.4 Phase 4, car and conflicts

Deliver:

- Car view
    
- Resource overlap logic
    
- Car clash warnings
    
- Responsibility warnings
    
- Conflict cards
    
- Acknowledge/resolve state if required
    

## 25.5 Phase 5, recurring events and templates

Deliver:

- Event templates
    
- Series creation
    
- Recurrence expansion
    
- Occurrence exceptions
    
- Template-based event creation
    

## 25.6 Phase 6, import/export and hardening

Deliver:

- JSON export
    
- JSON import preview
    
- Validation
    
- Restore flow
    
- Reset local data
    
- Manual test data
    
- Mobile polish
    
- Offline test
    
- iPhone install test
    

---

## 26. Architecture Risks and Mitigations

## 26.1 IndexedDB complexity

Risk:

Direct IndexedDB can become awkward.

Mitigation:

Use a wrapper and isolate all database access behind repositories.

## 26.2 Recurrence complexity

Risk:

Recurring events can become difficult quickly.

Mitigation:

Support a small recurrence set first:

- Weekly
    
- Fortnightly
    
- Monthly
    
- Date range
    
- Cancelled/moved occurrence
    

Avoid complex rules until needed.

## 26.3 Reminder expectations

Risk:

Users may expect native push notifications immediately.

Mitigation:

Make v1 reminders visible in-app. Treat push as a later capability.

## 26.4 Local data loss

Risk:

Browser data can be cleared.

Mitigation:

Make JSON export prominent. Add backup prompts. Consider future sync.

## 26.5 Scope creep

Risk:

The app becomes a clone of Cozi or OurHome.

Mitigation:

Keep product focus on:

- Time
    
- Responsibility
    
- Car/resource need
    
- Preparation
    
- Conflicts
    

## 26.6 Over-engineering

Risk:

Building sync, permissions and AI before the core app proves useful.

Mitigation:

Keep the MVP static-hosted and local-first.

---

## 27. Recommended Architecture Decision Record

## Decision 001: Local-first PWA for MVP

Status: Accepted

Decision:

Build the MVP as a local-first static PWA using client-side storage.

Reason:

The app is private, family-specific and should prove value before backend complexity.

Consequences:

- Fast build.
    
- Low hosting cost.
    
- Strong privacy posture.
    
- Manual backup required.
    
- Multi-user sync deferred.
    

---

## Decision 002: IndexedDB for structured local storage

Status: Accepted

Decision:

Use IndexedDB, accessed through a wrapper such as Dexie.

Reason:

The app needs structured records, indexes, schema upgrades and more reliability than localStorage.

Consequences:

- Better long-term local data model.
    
- Slightly more setup complexity.
    
- Cleaner migration path.
    

---

## Decision 003: Embedded prep tasks, reminders and resource needs in events for MVP

Status: Accepted

Decision:

Store prep tasks, reminders and resource needs inside event records initially.

Reason:

They are event-owned in most MVP scenarios and easier to import/export this way.

Consequences:

- Simpler event editing.
    
- Simpler backup.
    
- Less relational complexity.
    
- May need refactoring if tasks become a wider task system.
    

---

## Decision 004: Live-calculated conflicts

Status: Accepted

Decision:

Calculate conflicts from current data rather than storing all conflicts permanently.

Reason:

Stored conflicts can become stale when events change.

Consequences:

- Conflict output is always current.
    
- Acknowledgement state may need separate storage later.
    
- Domain logic must remain efficient and testable.
    

---

## Decision 005: Calendar sync deferred

Status: Accepted

Decision:

Do not include Google, Apple or Outlook calendar sync in MVP.

Reason:

The Lawrence Loop is a logistics layer, not merely a calendar. External events lack family-specific preparation and responsibility fields.

Consequences:

- Simpler MVP.
    
- Manual entry required.
    
- Future import/sync path remains open.
    

---

## Decision 006: Push notifications deferred

Status: Accepted

Decision:

Use in-app reminders for MVP. Defer push notifications.

Reason:

True push introduces platform, permission and potential backend concerns.

Consequences:

- MVP remains simpler.
    
- Dashboard and Today view must be strong.
    
- Future data model should still support notification triggers.
    

---

## 28. Technical Definition of Done for v1

The technical MVP is complete when:

- The app installs as a PWA.
    
- The app opens offline after first load.
    
- Family data is stored locally.
    
- Events can be created, edited and deleted.
    
- Events can include participants, responsibility, car needs and prep tasks.
    
- Today, Week, Car and Prep views are functional.
    
- Car conflicts are detected.
    
- Overdue critical preparation is detected.
    
- Recurring events work for core family patterns.
    
- Templates speed up event creation.
    
- JSON export works.
    
- JSON import validates before commit.
    
- Bad imports are blocked safely.
    
- The app is usable on iPhone.
    
- The architecture does not require a backend.
    

---

## 29. Recommended Next Artefact

The next artefact should be:

**Build Plan v0.1**

That document should turn this architecture into a sequenced implementation plan with:

- Build phases
    
- Dependencies
    
- Acceptance criteria
    
- Test scenarios
    
- Suggested development prompts
    
- MVP cut line
    
- Future backlog
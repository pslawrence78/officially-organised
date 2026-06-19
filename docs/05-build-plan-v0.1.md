# The Lawrence Loop

## Build Plan v0.1

## 1. Build Purpose

This build plan turns the Product Specification v0.2 and Technical Architecture v0.1 into a practical implementation sequence.

The aim is to build a private, mobile-first, local-first PWA that helps the Lawrence family manage:

- Family events
    
- Responsibility
    
- Car usage
    
- Preparation tasks
    
- Recurring routines
    
- Practical conflicts
    
- JSON backup and restore
    

The first version should prove the core value before adding sync, push notifications, AI, calendar integration or multi-user complexity.

---

## 2. MVP Definition

The MVP is:

> A local-first family logistics PWA where Phil and Beck can create events, assign family members, assign responsibility, track car needs, manage preparation tasks, view the week ahead, and detect practical clashes.

The MVP must be useful even if used by one parent on one device.

---

## 3. MVP Cut Line

## 3.1 Must Have

The first complete MVP must include:

1. Installable PWA shell
    
2. Local IndexedDB storage
    
3. Seeded Lawrence family members
    
4. Seeded family car resource
    
5. Seeded event categories
    
6. Seeded event templates
    
7. Event creation and editing
    
8. Place creation and selection
    
9. Family member assignment
    
10. Responsible adult assignment
    
11. Car need tracking
    
12. Preparation tasks on events
    
13. Today view
    
14. Week view
    
15. Dashboard
    
16. Car view
    
17. Prep view
    
18. Basic recurring events
    
19. Car conflict detection
    
20. Prep overdue detection
    
21. Responsibility gap detection
    
22. JSON export
    
23. JSON import with validation and preview
    
24. Mobile-first responsive design
    
25. Offline operation after first load
    

## 3.2 Should Have

Useful but not critical for the first MVP:

1. Month calendar view
    
2. Event search
    
3. Conflict acknowledgement
    
4. Template editing
    
5. Place management screen
    
6. Basic audit log
    
7. Reset local data
    
8. Backup reminder
    
9. Simple install guidance screen
    

## 3.3 Could Have Later

Do not include in MVP unless the build is already stable:

1. Push notifications
    
2. Shared Phil and Beck accounts
    
3. Cloud sync
    
4. AI weekly review
    
5. Google/iCloud calendar sync
    
6. Alexa/Home Assistant integration
    
7. Family command board
    
8. Child-friendly Seb view
    
9. Linkage with Properly Packed
    
10. Gift tracking module
    
11. School term import
    
12. Full pet care module
    

---

## 4. Build Principles

## 4.1 Prove usefulness before sophistication

The first build should answer:

- What is happening today?
    
- What needs preparing?
    
- Who is responsible?
    
- Does anyone need the car?
    
- Are we about to miss something?
    

## 4.2 Avoid generic calendar creep

The app should not become a calendar clone. The differentiated value is:

- Car/resource visibility
    
- Preparation memory
    
- Responsibility clarity
    
- Family-specific routines
    
- Practical conflict detection
    

## 4.3 Keep data local and portable

The app should store data locally, but backup and restore must be easy.

## 4.4 Build test data early

The app should include realistic Lawrence-style seed data during development so the interface can be tested against real use patterns.

## 4.5 Do not overbuild recurrence

Recurring events are needed, but v1 should support practical patterns only:

- Weekly
    
- Fortnightly
    
- Monthly
    
- Date range
    
- Cancelled occurrence
    
- Moved occurrence
    

---

# 5. Build Phases

---

## Phase 1: Project Foundation

## Objective

Create the technical skeleton of the PWA.

## Deliverables

- React + TypeScript + Vite project
    
- Mobile-first app shell
    
- Route structure
    
- Basic theme tokens
    
- PWA manifest
    
- Service worker setup
    
- App icons placeholder
    
- Offline shell support
    
- Core navigation
    

## Suggested routes

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

## Initial navigation

Primary mobile navigation:

- Dashboard
    
- Today
    
- Week
    
- Car
    
- Prep
    

Secondary navigation:

- People
    
- Routines
    
- Templates
    
- Places
    
- Settings
    

## Acceptance Criteria

- App runs locally.
    
- App has mobile-first layout.
    
- Navigation works.
    
- App can be installed as a PWA once hosted over HTTPS.
    
- App shell can load offline after first visit.
    
- No family logic is hard-coded into page components unnecessarily.
    

## Test Scenarios

- Open app on desktop.
    
- Open app in mobile-sized viewport.
    
- Navigate between all placeholder pages.
    
- Simulate offline mode and reload app shell.
    
- Confirm manifest metadata is valid.
    

---

## Phase 2: Data Foundation

## Objective

Implement the local data layer and seed baseline Lawrence family data.

## Deliverables

- IndexedDB database
    
- Repository abstraction
    
- Schema versioning
    
- Domain TypeScript types
    
- Seed data loader
    
- Settings store
    
- Basic audit log foundation
    

## Core data stores

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

## Seed records

Family members:

- Phil
    
- Beck
    
- Seb
    
- Albert
    

Resources:

- Family car
    

Categories:

- School
    
- Club
    
- Lesson
    
- Birthday party
    
- Playdate
    
- Family social
    
- Medical
    
- Dentist
    
- Vet
    
- Work
    
- Travel
    
- Baby Group
    
- Photography
    
- Dog care
    
- Household admin
    
- Reminder only
    

Templates:

- Swimming lesson
    
- Gymnastics
    
- Beavers
    
- Birthday party
    
- Baby Group block
    
- Oracle office day
    
- Vet appointment
    
- Dentist or health appointment
    
- School special day
    

## Acceptance Criteria

- App creates local database on first launch.
    
- Seed data is created only once.
    
- Existing local data is not overwritten accidentally.
    
- Repositories expose CRUD functions.
    
- UI can read seeded family members, resources, categories and templates.
    
- Schema version is stored.
    

## Test Scenarios

- First launch creates database.
    
- Second launch does not duplicate seed records.
    
- Clear database and relaunch reseeds correctly.
    
- Repository methods can create, read, update and delete records.
    
- Seed family members appear in a basic test view.
    

---

## Phase 3: Event Model and Manual Event Entry

## Objective

Allow users to create, edit and delete standard events.

## Deliverables

- Event domain model
    
- Event form
    
- Event detail screen
    
- Event card component
    
- Event list component
    
- Place selection
    
- Participant selection
    
- Responsible adult selection
    
- Event status
    
- Notes field
    
- Delete event flow
    

## Event form fields

Required:

- Title
    
- Start date/time
    
- End date/time
    
- Category
    
- Participants
    

Recommended:

- Place
    
- Responsible adult
    
- Status
    
- Notes
    

Optional:

- All-day
    
- Template source
    
- Series source
    

## Acceptance Criteria

- User can create an event.
    
- User can edit an event.
    
- User can delete an event.
    
- User can assign Phil, Beck, Seb and/or Albert.
    
- User can assign responsible adult.
    
- User can select category.
    
- User can select existing place or leave place blank.
    
- Event appears on Today and Week views if relevant.
    

## Test Scenarios

- Create Seb swimming event.
    
- Create Phil Oracle office day.
    
- Create Albert vet appointment.
    
- Edit event time.
    
- Change responsible adult.
    
- Delete event.
    
- Create all-day school reminder.
    
- Create event with multiple participants.
    

---

## Phase 4: Places

## Objective

Allow reusable locations to be created and attached to events.

## Deliverables

- Place model
    
- Place repository
    
- Places list screen
    
- Add/edit place form
    
- Place selector in event form
    
- Basic travel note support
    
- Default travel minutes field
    

## Place fields

- Name
    
- Type
    
- Address
    
- Postcode
    
- Default travel minutes
    
- Travel notes
    
- Parking notes
    

## Suggested starter places

- Home
    
- Seb’s school
    
- Lichfield Leisure Centre
    
- Joe Fraser Gymnastics Club Lichfield
    
- Beavers HQ
    
- Vet
    
- Dentist
    
- Oracle office, generic placeholder
    

## Acceptance Criteria

- User can create a place.
    
- User can edit a place.
    
- User can attach a place to an event.
    
- Place details are shown on event detail.
    
- Default travel minutes can be used later by conflict logic.
    

## Test Scenarios

- Add gymnastics venue.
    
- Add vet practice.
    
- Attach place to event.
    
- Edit parking note.
    
- Confirm events still load if place is deleted or missing, with safe fallback.
    

---

## Phase 5: Preparation Tasks

## Objective

Add operational memory to events through preparation checklists.

## Deliverables

- Prep task model embedded inside event
    
- Add/edit/delete prep task within event form
    
- Tick-off behaviour
    
- Prep task card
    
- Prep view
    
- Prep due grouping
    
- Critical task styling
    
- Overdue logic
    

## Prep task fields

- Title
    
- Owner
    
- Due date/time
    
- Priority
    
- Status
    
- Blocks event
    
- Notes
    

## Prep view sections

- Overdue
    
- Due today
    
- Due tomorrow
    
- Due this week
    
- Later
    

## Acceptance Criteria

- User can add prep tasks to an event.
    
- User can assign prep task owner.
    
- User can mark task done.
    
- User can mark task skipped.
    
- Overdue open tasks are highlighted.
    
- Critical overdue tasks are clearly visible.
    
- Prep view aggregates tasks across all events.
    

## Test Scenarios

- Add “Pack swimming kit” to swimming.
    
- Add “Buy present” to birthday party.
    
- Mark present as done.
    
- Leave critical task overdue and confirm warning.
    
- Skip a non-critical task.
    
- View all open prep tasks from Prep screen.
    

---

## Phase 6: Car Resource Needs

## Objective

Make car usage explicit and visible.

## Deliverables

- Resource need model embedded inside event
    
- Car need section in event form
    
- Need status: required, maybe, not required
    
- Needed from/until fields
    
- Allocated to field
    
- Car view
    
- Car badge on event cards
    

## Car view sections

- Today
    
- Tomorrow
    
- This week
    
- Possible clashes
    
- Maybe needs
    

## Acceptance Criteria

- User can mark car as required.
    
- User can mark car as maybe required.
    
- User can define resource window separately from event time.
    
- Car view shows all upcoming car needs.
    
- Event cards show car requirement.
    
- Car need can be allocated to Phil or Beck.
    

## Test Scenarios

- Beck Baby Group requires car 09:00–12:00.
    
- Phil Oracle meeting maybe requires car 08:30–13:30.
    
- Seb gymnastics requires car 16:35–18:20.
    
- Car view groups all correctly.
    
- Changing car need updates Car view.
    

---

## Phase 7: Conflict Detection v1

## Objective

Detect the highest-value practical conflicts.

## Deliverables

- Conflict service
    
- Car conflict detection
    
- Responsibility gap detection
    
- Prep overdue detection
    
- Conflict cards
    
- Dashboard conflict section
    
- Conflict badges on relevant events
    

## Conflict types for v1

1. Car conflict
    
2. Maybe car conflict
    
3. Unassigned responsibility
    
4. Prep overdue
    
5. Critical prep overdue
    

## v1 conflict rules

### Required car clash

Trigger when two events require the family car and their needed windows overlap.

### Maybe car clash

Trigger when one event requires the car and another maybe requires it, with overlapping needed windows.

### Unassigned responsibility

Trigger when an event includes Seb or Albert and no responsible adult is assigned.

### Prep overdue

Trigger when a prep task is open and its due date has passed.

### Critical prep overdue

Trigger when a prep task is open, due date has passed, and `blocksEvent` is true.

## Acceptance Criteria

- Conflicts are calculated from current data.
    
- Changing event time recalculates conflicts.
    
- Changing car need recalculates conflicts.
    
- Completing prep task removes relevant prep conflict.
    
- Dashboard shows conflict count and details.
    
- Event cards show conflict badges.
    

## Test Scenarios

- Create two overlapping required car events.
    
- Create required and maybe car overlap.
    
- Create Seb event without responsible adult.
    
- Add overdue critical prep task.
    
- Resolve conflict by changing resource window.
    
- Resolve prep conflict by marking task done.
    

---

## Phase 8: Dashboard

## Objective

Create the family command centre.

## Deliverables

- Dashboard service
    
- Dashboard page
    
- Today summary
    
- Tomorrow summary
    
- Needs attention section
    
- Car watch section
    
- Prep due section
    
- Coming up section
    
- Quick add button
    

## Dashboard priority order

1. Critical conflicts
    
2. Critical overdue prep
    
3. Today’s events
    
4. Today’s car needs
    
5. Tomorrow’s preparation
    
6. Upcoming unusual events
    
7. Normal routine events
    

## Dashboard sections

### Today

Shows today’s schedule and responsibilities.

### Needs attention

Shows conflicts, missing responsibility and critical prep.

### Car watch

Shows car required and maybe required.

### Prep due

Shows open prep tasks.

### Coming up

Shows next few notable events.

## Acceptance Criteria

- Dashboard loads quickly.
    
- Dashboard shows useful information without requiring calendar browsing.
    
- Critical items appear at the top.
    
- User can tap through to event detail.
    
- User can tick prep tasks from dashboard.
    
- Empty states are helpful.
    

## Test Scenarios

- Day with no events.
    
- Day with Seb club and prep.
    
- Day with car clash.
    
- Day with overdue birthday present task.
    
- Week with Phil office day and Beck Baby Group.
    
- Tomorrow has critical prep due.
    

---

## Phase 9: Today, Week and Calendar Views

## Objective

Provide clear schedule browsing without making the calendar the whole product.

## Deliverables

- Today page
    
- Week page
    
- Basic calendar page
    
- Event timeline
    
- Week day cards
    
- Month grid if included
    
- Event filters by person/category
    
- Tap-through event detail
    

## Today view

Should show:

- Timeline
    
- Event cards
    
- Responsible adult
    
- Participants
    
- Car needs
    
- Prep tasks
    
- Conflicts
    

## Week view

Should show:

- Day-by-day summary
    
- Busy day indicators
    
- Car icons
    
- Prep indicators
    
- Conflict badges
    
- Unusual event emphasis
    

## Calendar view

Should show:

- Simple month overview
    
- Events by day
    
- Tap day to inspect
    

## Acceptance Criteria

- Today view answers what is happening today.
    
- Week view answers what is unusual this week.
    
- Calendar view supports wider browsing.
    
- Views remain usable on iPhone.
    
- Event cards remain consistent across views.
    

## Test Scenarios

- Week with multiple Seb clubs.
    
- Week with one Baby Group session.
    
- Week with one Oracle office day.
    
- Day with no events.
    
- Day with several events.
    
- Month with recurring events.
    

---

## Phase 10: Templates

## Objective

Speed up event creation and reduce manual entry.

## Deliverables

- Template model
    
- Seeded templates
    
- Create event from template flow
    
- Apply default prep tasks
    
- Apply default reminders
    
- Apply default car need
    
- Template list screen
    
- Template detail screen
    

## Seeded MVP templates

- Swimming lesson
    
- Gymnastics
    
- Beavers
    
- Birthday party
    
- Baby Group block
    
- Oracle office day
    
- Vet appointment
    
- Dentist or health appointment
    
- School special day
    

## Acceptance Criteria

- User can create an event from a template.
    
- Template applies default category.
    
- Template applies default prep tasks.
    
- Template applies default car need where relevant.
    
- User can edit the generated event before saving.
    
- Template-created event behaves like a normal event after save.
    

## Test Scenarios

- Create birthday party from template.
    
- Create swimming lesson from template.
    
- Create Oracle office day from template.
    
- Remove one default prep task before saving.
    
- Change responsible adult before saving.
    
- Confirm generated event appears correctly in dashboard.
    

---

## Phase 11: Recurring Events v1

## Objective

Support routine family commitments without duplicating manual events.

## Deliverables

- Event series model
    
- Series form
    
- Weekly recurrence
    
- Fortnightly recurrence
    
- Monthly recurrence
    
- Date range
    
- Recurrence expansion for visible windows
    
- Cancelled occurrence exception
    
- Moved occurrence exception
    
- Edited occurrence materialisation
    

## Recurrence types for v1

- Weekly
    
- Fortnightly
    
- Monthly
    

## Required recurring examples

- Seb swimming
    
- Seb gymnastics
    
- Beavers
    
- Cricket season
    
- Baby Group block
    
- Dentist reminder
    
- Vet annual check
    

## Acceptance Criteria

- User can create weekly recurring event.
    
- User can create recurring block with end date.
    
- Recurring events appear in Today and Week views.
    
- Recurring events contribute to car conflicts.
    
- Recurring events contribute to prep tasks.
    
- One occurrence can be cancelled.
    
- One occurrence can be moved.
    
- One occurrence can have changed responsibility.
    

## Test Scenarios

- Create weekly swimming.
    
- Create Baby Group block for six weeks.
    
- Cancel one swimming lesson.
    
- Move one gymnastics session.
    
- Change responsible adult for one occurrence.
    
- Confirm car conflicts detect generated occurrences.
    

---

## Phase 12: People Views

## Objective

Allow the family schedule to be seen through Phil, Beck, Seb and Albert.

## Deliverables

- People landing page
    
- Person detail page
    
- Person event list
    
- Person responsibilities
    
- Person prep tasks
    
- Person car needs
    
- Person conflict indicators
    

## Person views

### Phil

Shows:

- Work events
    
- Events Phil is responsible for
    
- Car needs
    
- Prep tasks owned by Phil
    

### Beck

Shows:

- Baby Group sessions
    
- Photography/family events
    
- Events Beck is responsible for
    
- Car needs
    
- Prep tasks owned by Beck
    

### Seb

Shows:

- School
    
- Clubs
    
- Lessons
    
- Parties
    
- Playdates
    
- Prep needed for Seb
    

### Albert

Shows:

- Vet appointments
    
- Dog care reminders
    
- Care coverage events
    

## Acceptance Criteria

- User can open each person view.
    
- Each view shows relevant events.
    
- Responsibility and participation are both represented.
    
- Prep tasks owned by or related to a person are visible.
    
- Albert works naturally as a pet family member.
    

## Test Scenarios

- Seb view shows swimming and gymnastics.
    
- Phil view shows Oracle day and tasks assigned to Phil.
    
- Beck view shows Baby Group and birthday party prep.
    
- Albert view shows vet appointment.
    
- Event involving all family members appears sensibly.
    

---

## Phase 13: Import, Export and Reset

## Objective

Protect local data and support safe migration.

## Deliverables

- JSON export
    
- JSON import by file
    
- JSON import by paste
    
- Import validation
    
- Import preview
    
- Restore confirmation
    
- Reset local data
    
- Export warning
    
- Schema version support
    

## Export shape

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

## Import validation must check

- Schema name
    
- Schema version
    
- Required fields
    
- Duplicate IDs
    
- Invalid date values
    
- Broken references
    
- Unknown family member IDs
    
- Unknown place IDs
    
- Unknown resource IDs
    
- Invalid event times
    
- Missing household
    

## Acceptance Criteria

- User can export all data to JSON.
    
- Export filename includes date.
    
- User can import valid backup.
    
- User can preview import before commit.
    
- Invalid import is blocked.
    
- Restore requires explicit confirmation.
    
- Reset local data requires explicit confirmation.
    
- Import does not silently corrupt live data.
    

## Test Scenarios

- Export empty seeded app.
    
- Export app with events.
    
- Import valid backup.
    
- Import file with missing family member reference.
    
- Import file with duplicate event IDs.
    
- Cancel import before commit.
    
- Reset app and confirm seed data returns.
    

---

## Phase 14: Mobile Polish and PWA Hardening

## Objective

Make the app genuinely usable as an iPhone home-screen PWA.

## Deliverables

- Mobile layout polish
    
- Safe area handling
    
- Touch target review
    
- Bottom navigation refinement
    
- Offline behaviour validation
    
- PWA icon set
    
- Loading states
    
- Empty states
    
- Error states
    
- Update available prompt
    
- Accessibility pass
    

## Acceptance Criteria

- App is comfortable on iPhone.
    
- App works in standalone PWA mode.
    
- Bottom navigation is easy to use.
    
- Forms are not frustrating on mobile.
    
- Offline launch works.
    
- Data persists after closing and reopening.
    
- User gets safe feedback when something goes wrong.
    
- No page feels like a desktop form squeezed into mobile.
    

## Test Scenarios

- Add event on iPhone.
    
- Edit event on iPhone.
    
- Tick prep task on iPhone.
    
- Use app offline.
    
- Relaunch from home screen.
    
- Test large text setting.
    
- Test long event names.
    
- Test dense day with several events.
    

---

## Phase 15: MVP Test Dataset

## Objective

Validate the product against realistic Lawrence family usage.

## Deliverables

- Realistic test week dataset
    
- Realistic recurring events
    
- Car clash examples
    
- Prep overdue examples
    
- Birthday party example
    
- Baby Group block example
    
- Oracle office day example
    
- Albert vet example
    

## Required test week

The dataset should include:

- School days
    
- Seb gymnastics
    
- Seb swimming
    
- Beavers or cricket
    
- Beck Baby Group session
    
- Phil Oracle office/customer day
    
- Albert vet appointment
    
- Birthday party
    
- Family social activity
    
- Weekly review
    
- School week preparation
    

## Acceptance Criteria

- Dashboard feels useful with this dataset.
    
- Car view exposes at least one clash.
    
- Prep view exposes meaningful tasks.
    
- Week view is readable.
    
- People views show useful segmentation.
    
- The model does not feel bloated.
    

## Test Scenarios

- Tuesday car clash between Beck and Phil.
    
- Birthday party present overdue.
    
- Seb swimming with kit checklist.
    
- Albert vet appointment with car need.
    
- Phil office day maybe requiring car.
    
- Sunday weekly review showing next week.
    

---

# 6. Development Prompt Sequence

These are suggested prompts for staged implementation in a clean coding environment.

## Prompt 1: Project Foundation

Build the initial React, TypeScript and Vite PWA shell for The Lawrence Loop. Create a mobile-first layout, routes, placeholder pages, theme tokens, app manifest, service worker foundation and bottom navigation. Do not implement business logic yet. Prioritise clean structure, maintainability and iPhone usability.

## Prompt 2: Local Data Foundation

Implement the IndexedDB local data layer using a repository pattern. Add schema versioning, seed records for Phil, Beck, Seb, Albert, the family car, MVP categories and starter templates. Ensure seed data is created only once and never duplicates on relaunch.

## Prompt 3: Event CRUD

Implement event creation, editing, deletion and detail views. Events must support title, category, status, start/end, all-day flag, participants, responsible adults, place, notes and timestamps. Events should appear in Today and Week views.

## Prompt 4: Places

Implement reusable Places with add/edit/list functionality. Places should support name, type, address, postcode, default travel minutes, travel notes and parking notes. Events should be able to reference places safely.

## Prompt 5: Preparation Tasks

Add embedded preparation tasks to events. Support task owner, due date, priority, status, blocks-event flag and notes. Build the Prep view and allow tasks to be completed from event detail, dashboard and Prep view.

## Prompt 6: Car Needs

Add resource needs to events, focused initially on the family car. Support required, maybe and not required statuses, needed-from and needed-until windows, allocated person and notes. Build the Car view and car badges.

## Prompt 7: Conflict Detection

Implement deterministic conflict detection for required car clashes, maybe car clashes, unassigned responsibility, overdue prep and critical overdue prep. Surface conflicts on Dashboard, Event cards and Event detail.

## Prompt 8: Dashboard

Build the operational Dashboard with Today, Needs Attention, Car Watch, Prep Due and Coming Up sections. Prioritise critical conflicts and preparation risks above ordinary events.

## Prompt 9: Templates

Implement template-based event creation using seeded templates for swimming, gymnastics, Beavers, birthday party, Baby Group block, Oracle office day, vet appointment, dentist/health appointment and school special day.

## Prompt 10: Recurring Events

Implement recurring event series for weekly, fortnightly and monthly patterns. Support date ranges, generated occurrences, cancelled occurrence exceptions, moved occurrence exceptions and edited occurrence materialisation.

## Prompt 11: People Views

Implement People and Person Detail views for Phil, Beck, Seb and Albert. Show events, responsibilities, prep tasks, car needs and relevant conflicts for each person.

## Prompt 12: Import and Export

Implement versioned JSON export and safe import. Import must support file and paste input, preview before commit, schema validation, reference validation and explicit restore confirmation. Bad imports must be blocked with clear errors.

## Prompt 13: PWA Hardening

Polish the app for iPhone PWA use. Validate offline shell, standalone launch, touch targets, mobile forms, empty states, error states, update prompt, accessibility basics and realistic test data.

---

# 7. MVP Acceptance Test Suite

## 7.1 Core Event Tests

- Create a basic event.
    
- Edit event title.
    
- Edit event time.
    
- Delete event.
    
- Add participants.
    
- Add responsible adult.
    
- Add place.
    
- Add notes.
    
- Create all-day event.
    

## 7.2 Prep Task Tests

- Add prep task.
    
- Mark prep task done.
    
- Mark prep task skipped.
    
- Make prep task critical.
    
- Show overdue prep.
    
- Show critical overdue prep.
    
- Filter prep by owner.
    
- Display prep on dashboard.
    

## 7.3 Car Tests

- Mark event as car required.
    
- Mark event as car maybe required.
    
- Set car needed-from and needed-until.
    
- Show car need on event card.
    
- Show car need in Car view.
    
- Detect overlapping required car needs.
    
- Detect required/maybe overlap.
    
- Resolve by changing time.
    

## 7.4 Responsibility Tests

- Create Seb event with responsible adult.
    
- Create Seb event without responsible adult.
    
- Confirm responsibility warning appears.
    
- Assign responsible adult and confirm warning disappears.
    
- Create Albert event without adult and confirm warning appears.
    

## 7.5 Recurrence Tests

- Create weekly swimming.
    
- Create fortnightly Beavers.
    
- Create monthly dentist reminder.
    
- Create six-week Baby Group block.
    
- Cancel one occurrence.
    
- Move one occurrence.
    
- Edit one occurrence.
    
- Confirm occurrences appear in Week view.
    
- Confirm occurrences contribute to conflicts.
    

## 7.6 Import and Export Tests

- Export seeded app.
    
- Export populated app.
    
- Import valid export.
    
- Reject wrong schema.
    
- Reject duplicate IDs.
    
- Reject broken place reference.
    
- Reject broken family member reference.
    
- Reject invalid date.
    
- Cancel import safely.
    
- Restore with confirmation.
    

## 7.7 PWA Tests

- App loads on mobile.
    
- App installs to home screen.
    
- App opens in standalone mode.
    
- App shell works offline.
    
- Data persists across relaunch.
    
- Event creation works offline.
    
- App handles refresh safely.
    
- Export works on mobile.
    

---

# 8. Realistic MVP Demo Script

The MVP should be demonstrable using this scenario.

## Step 1: Open Dashboard

Expected result:

- Today’s events visible.
    
- Prep due visible.
    
- No user needs to browse month calendar first.
    

## Step 2: Add Beck Baby Group

- Use Baby Group Block template.
    
- Set Tuesday 09:30–11:30.
    
- Mark family car required 09:00–12:00.
    
- Assign Beck.
    

Expected result:

- Event appears in Week view.
    
- Car need appears in Car view.
    

## Step 3: Add Phil Oracle Meeting

- Use Oracle Office Day template.
    
- Set Tuesday 10:00–13:00.
    
- Mark car maybe required 08:30–13:30.
    
- Assign Phil.
    

Expected result:

- Dashboard flags possible car clash.
    
- Car view shows overlapping windows.
    

## Step 4: Add Seb Swimming

- Use Swimming Lesson template.
    
- Set Wednesday 17:30–18:00.
    
- Assign Seb.
    
- Responsible adult Phil.
    
- Car required.
    
- Prep tasks generated.
    

Expected result:

- Prep view shows swimming kit tasks.
    
- Today/Week views show car and responsibility.
    

## Step 5: Add Birthday Party

- Use Birthday Party template.
    
- Set Saturday 10:30–12:30.
    
- Assign Seb.
    
- Responsible adult Beck.
    
- Add present/card/address tasks.
    

Expected result:

- Prep view shows present and card due before Saturday.
    
- Dashboard flags critical prep if overdue.
    

## Step 6: Add Albert Vet Appointment

- Use Vet Appointment template.
    
- Set Thursday 17:00.
    
- Assign Albert.
    
- Responsible adult Beck.
    
- Car required.
    

Expected result:

- Albert view shows vet appointment.
    
- Car view shows requirement.
    
- Prep tasks appear.
    

## Step 7: Weekly Review

Open Week view.

Expected result:

- Busy days visible.
    
- Car clash visible.
    
- Prep tasks visible.
    
- Responsibility gaps visible if any.
    
- The app feels like a logistics assistant, not just a diary.
    

---

# 9. Key Build Risks

## 9.1 Recurrence becomes too complex

Mitigation:

Limit recurrence to weekly, fortnightly and monthly patterns for v1.

## 9.2 Forms become too heavy

Mitigation:

Use templates, progressive disclosure and quick-add defaults.

## 9.3 App becomes too calendar-centric

Mitigation:

Make Dashboard, Car and Prep views primary.

## 9.4 Local data is lost

Mitigation:

Make export prominent from the first working version.

## 9.5 Conflict logic becomes unreliable

Mitigation:

Keep conflict rules deterministic and well tested.

## 9.6 Overbuilding sync too early

Mitigation:

Defer sync until the family proves the single-device version is useful.

---

# 10. Recommended First Implementation Boundary

The first coding milestone should not attempt the whole MVP.

The first implementation should deliver:

1. PWA shell
    
2. Local database
    
3. Seed family data
    
4. Manual event creation
    
5. Today view
    
6. Basic event cards
    

This proves the foundation before adding car logic, prep, templates and recurrence.

---

# 11. Recommended Milestone Order

## Milestone A: App foundation

Includes:

- Project scaffold
    
- Routing
    
- PWA shell
    
- Theme
    
- Navigation
    
- Local database
    
- Seed data
    

## Milestone B: Events

Includes:

- Event CRUD
    
- Places
    
- Participants
    
- Responsibility
    
- Today and Week views
    

## Milestone C: Operational memory

Includes:

- Prep tasks
    
- Prep view
    
- Car needs
    
- Car view
    

## Milestone D: Intelligence

Includes:

- Conflict detection
    
- Dashboard prioritisation
    
- Responsibility gaps
    
- Prep overdue logic
    

## Milestone E: Speed and repeatability

Includes:

- Templates
    
- Recurring events
    
- Occurrence exceptions
    

## Milestone F: Safety and polish

Includes:

- JSON export
    
- JSON import
    
- Reset
    
- PWA hardening
    
- iPhone testing
    

---

# 12. Definition of Done for MVP v1

The MVP is done when:

- Phil or Beck can open the app from an iPhone home screen.
    
- The app works after first load without internet.
    
- The Lawrence family members are present.
    
- The family car is present.
    
- Events can be created, edited and deleted.
    
- Events can include participants and responsible adults.
    
- Events can include car needs.
    
- Events can include prep tasks.
    
- Today view is useful.
    
- Week view is useful.
    
- Dashboard highlights what needs attention.
    
- Car view shows car needs and clashes.
    
- Prep view shows outstanding preparation.
    
- Recurring clubs and blocks work.
    
- Templates make event creation fast.
    
- JSON export works.
    
- JSON import validates before committing.
    
- Bad data is rejected safely.
    
- The app remains focused on family logistics rather than becoming a generic organiser.
    

---

# 13. Recommended Next Artefact

The next artefact should be:

**Initial Implementation Prompt v0.1**

That prompt should instruct a coding agent to build Milestone A only:

- React + TypeScript + Vite PWA foundation
    
- Mobile-first app shell
    
- Navigation
    
- Theme
    
- IndexedDB setup
    
- Seed Lawrence family records
    
- Placeholder pages
    
- Clean architecture
    

The first implementation prompt should explicitly avoid building the full app in one pass.
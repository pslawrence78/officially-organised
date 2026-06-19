# Lawrence Family Organiser PWA

## Product Specification v0.2

## 1. Working Title

### Primary working title

**The Lawrence Loop**

### Descriptive product name

**Lawrence Family Organiser**

### Working tagline

**Family plans, car clashes, kit reminders and the things we forget.**

The name can remain provisional. The product concept is stronger than the name at this stage.

---

## 2. Product Summary

The Lawrence Family Organiser is a private, mobile-first PWA designed to help Phil and Beck manage the practical logistics of family life across two adults, one child and one dog.

The app is not intended to be a generic shared calendar, chore chart, meal planner or family chat tool. Its purpose is to help the family remember what needs to happen, who is responsible, what needs preparing, and whether any practical clash exists before it becomes disruptive.

The product should provide a calm, reliable family operating layer over the recurring and sporadic commitments that shape everyday life.

---

## 3. Core Problem

The Lawrence family already has a working routine, but real-world coordination issues still occur because some needs are:

- Infrequent enough to be forgotten.
    
- Important enough to cause disruption when missed.
    
- Spread across different people, places and patterns.
    
- Not fully represented by a normal calendar entry.
    

Examples include:

- Beck needing the car unexpectedly during Baby Group blocks.
    
- Phil needing the car or travel time for Oracle meetings or office days.
    
- Seb needing kit, clothes, water bottles, presents, cards or forms for activities.
    
- Albert needing vet appointments, care planning or treatment follow-up.
    
- Health, dentist, school, birthday party and household appointments requiring preparation.
    
- Responsibility being assumed rather than explicitly agreed.
    

The app should prevent these small coordination failures by making the hidden logistics visible.

---

## 4. Product Objective

The product objective is:

> To give the Lawrence family a private, practical and mobile-first organiser that combines calendar events, family responsibility, car/resource planning, preparation tasks, reminders and conflict detection.

The app succeeds if it helps the family avoid forgotten details and practical clashes without creating more admin than it saves.

---

## 5. Target Users

## 5.1 Primary Users

### Phil

Uses the app to:

- Track family logistics.
    
- See when the car is needed.
    
- Add Oracle office days, customer meetings and travel.
    
- Check Seb’s clubs, school events and preparation needs.
    
- Avoid missed follow-up actions.
    
- Review the week ahead.
    

### Beck

Uses the app to:

- Add Baby Group blocks and photography-related commitments.
    
- Track school, social and family arrangements.
    
- Record when she needs the car.
    
- Manage birthday party and school preparation.
    
- Check shared responsibility.
    

## 5.2 Secondary Users

### Seb

Initially represented as a family member rather than an active app user.

Future potential:

- Read-only child-friendly view.
    
- Today/tomorrow view.
    
- Club and activity countdowns.
    
- “What do I need today?” view.
    

### Albert

Represented as a pet family member.

Used for:

- Vet appointments.
    
- Dog care reminders.
    
- Treatment reminders.
    
- Holiday/staycation considerations.
    
- Care coverage during long family days.
    

---

## 6. Product Principles

## 6.1 Mobile-first

The app should be designed primarily for iPhone use. Entry and review should be quick, clear and practical.

## 6.2 Family-specific

The system should be built around Phil, Beck, Seb and Albert. It does not need to support every possible family structure at first.

## 6.3 Calendar-plus

The app should treat events as operational commitments, not just diary entries.

Each important event may include:

- Participants
    
- Responsible adult
    
- Location
    
- Car/resource need
    
- Preparation checklist
    
- Reminder rules
    
- Notes
    
- Conflict status
    

## 6.4 Calm by default

The app should highlight meaningful risks, not produce noise. Alerts should be reserved for practical clashes, unresolved responsibility and time-sensitive preparation.

## 6.5 Fast capture

Adding something quickly must be possible. The system should support partial entry first, refinement later.

## 6.6 Local-first and private by design

Family schedules, child activities, health appointments and pet care notes are private. A local-first approach should be assumed unless a later architecture decision justifies backend sync.

## 6.7 No unnecessary bloat

The app should avoid becoming a full household management suite. Chores, meals, family chat, budgeting and detailed contacts are out of scope for v1.

---

## 7. MVP Scope

The MVP should focus on the coordination gaps most likely to cause real-world disruption.

## 7.1 Included in MVP

### Family dashboard

A quick view of today, tomorrow, unresolved prep tasks and known clashes.

### Today view

A focused view showing:

- Events today
    
- Who is involved
    
- Who is responsible
    
- Car needs
    
- Prep tasks
    
- Reminders
    
- Conflicts
    

### Week view

A planning view showing:

- Busy days
    
- Unusual commitments
    
- Car needs
    
- Responsibility gaps
    
- Preparation due this week
    

### Calendar view

A basic day/week/month structure for browsing commitments.

### People views

Separate views for:

- Phil
    
- Beck
    
- Seb
    
- Albert
    

Each person view should show upcoming events, responsibilities and preparation items.

### Car view

A dedicated view showing when the family car is needed, by whom, and whether any clashes exist.

### Prep view

A consolidated list of outstanding preparation tasks across all events.

### Event creation and editing

Manual event entry with family-specific fields.

### Recurring event support

Support for clubs, lessons, Baby Group blocks, appointments and repeating routines.

### Templates

Pre-built event templates for common Lawrence family scenarios.

### Conflict detection

Detect practical issues, especially:

- Car clashes
    
- Responsibility clashes
    
- Unassigned responsibility
    
- Overdue preparation
    
- Tight travel gaps
    
- Care gaps for Albert
    

### JSON import/export

The app should support safe backup, restore and future migration.

---

## 7.2 Excluded from MVP

The following are deliberately out of scope for the first version:

- Meal planning
    
- Shopping lists
    
- Chores
    
- Pocket money
    
- Family chat
    
- Detailed budgeting
    
- Full contact database
    
- Medical record storage
    
- School portal integration
    
- Live route planning
    
- Multi-household support
    
- Complex user permissions
    
- Public sharing
    
- Advanced AI scheduling
    
- Google/iCloud calendar sync unless added after MVP
    

These may be considered later, but only if they support the core purpose.

---

## 8. Core Product Concept

The central product concept is:

> An event is not just a point in time. It is a family commitment with people, responsibility, preparation and resources attached.

A normal calendar entry might say:

> Seb swimming, 17:30.

The Lawrence Family Organiser should know:

- Seb is attending.
    
- Phil or Beck needs to be responsible.
    
- The car is required.
    
- The car is needed before and after the actual lesson.
    
- Swimming kit, towel, goggles and water bottle are needed.
    
- The preparation should be visible before the day becomes rushed.
    
- A clash matters if Beck also needs the car.
    

---

## 9. Core Data Model

The MVP data model should include the following objects.

## 9.1 Household

Represents the Lawrence family as the top-level container.

Core fields:

- Household ID
    
- Household name
    
- Timezone
    
- Start of week
    
- Created date
    
- Updated date
    

## 9.2 Family Member

Represents Phil, Beck, Seb or Albert.

Core fields:

- Member ID
    
- Display name
    
- Member type: adult, child, pet
    
- Colour/icon
    
- Active status
    
- Default responsible adults, where relevant
    

Initial records:

- Phil, adult
    
- Beck, adult
    
- Seb, child
    
- Albert, pet
    

## 9.3 Resource

Represents a shared item that can be needed or clashed over.

MVP resource:

- Family car
    

Core fields:

- Resource ID
    
- Name
    
- Resource type
    
- Shared yes/no
    
- Active status
    

Future resources could include specialist photography kit, tablets, travel cases or other items, but these are not required for MVP.

## 9.4 Place

Represents reusable locations.

Core fields:

- Place ID
    
- Name
    
- Place type
    
- Address
    
- Postcode
    
- Default travel time
    
- Travel notes
    
- Parking notes
    

Example place types:

- Home
    
- School
    
- Club
    
- Medical
    
- Vet
    
- Office
    
- Social
    
- Travel
    
- Other
    

## 9.5 Event

The central object.

Core fields:

- Event ID
    
- Title
    
- Category
    
- Status
    
- Start date/time
    
- End date/time
    
- All-day flag
    
- Place
    
- Participants
    
- Responsible adult or adults
    
- Resource needs
    
- Preparation tasks
    
- Reminders
    
- Notes
    
- Recurring series ID, if applicable
    
- Template ID, if created from a template
    
- Created date
    
- Updated date
    

Suggested event statuses:

- Planned
    
- Confirmed
    
- Tentative
    
- Cancelled
    
- Completed
    

## 9.6 Resource Need

Represents when an event needs the family car or another resource.

Core fields:

- Resource
    
- Need status: required, maybe, not required
    
- Needed from
    
- Needed until
    
- Allocated to
    
- Notes
    

This must be separate from the event start and end time because the car may be needed before and after the actual event.

## 9.7 Preparation Task

Represents something that must be done, packed, bought, charged, completed or checked.

Core fields:

- Task ID
    
- Event ID
    
- Title
    
- Owner
    
- Due date/time
    
- Priority
    
- Status
    
- Blocks event yes/no
    
- Notes
    

Suggested task statuses:

- Open
    
- Done
    
- Skipped
    

Suggested priorities:

- Normal
    
- Important
    
- Critical
    

## 9.8 Reminder

Represents a useful prompt.

Core fields:

- Reminder ID
    
- Event ID
    
- Audience
    
- Trigger
    
- Reason
    
- Condition
    
- Completed/dismissed status
    

Example triggers:

- Same morning
    
- Night before
    
- Two days before
    
- One week before
    
- Custom date/time
    

## 9.9 Event Series

Represents recurring commitments.

Used for:

- Swimming
    
- Gymnastics
    
- Beavers
    
- Cricket
    
- Baby Group blocks
    
- School patterns
    
- Dentist appointments
    
- Vet checks
    

Core fields:

- Series ID
    
- Title
    
- Category
    
- Recurrence rule
    
- Start date
    
- End date
    
- Default place
    
- Default participants
    
- Default responsible adults
    
- Default resource needs
    
- Default preparation tasks
    
- Exceptions
    

## 9.10 Template

Represents a reusable event starter.

Core fields:

- Template ID
    
- Name
    
- Category
    
- Default duration
    
- Default participants
    
- Default resource needs
    
- Default preparation tasks
    
- Default reminders
    
- Default notes
    

## 9.11 Conflict

Represents an issue detected by the app.

Core fields:

- Conflict ID
    
- Conflict type
    
- Severity
    
- Related event IDs
    
- Message
    
- Suggested action
    
- Resolution status
    

Conflict types:

- Car conflict
    
- Responsibility conflict
    
- Unassigned responsibility
    
- Preparation overdue
    
- Double booking
    
- Tight travel gap
    
- Albert care gap
    

Severity levels:

- Info
    
- Warning
    
- Critical
    

---

## 10. Event Categories

Initial categories should be controlled rather than fully user-defined.

MVP categories:

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
    

These should be enough to structure the first version without creating too much setup burden.

---

## 11. Event Templates

Templates are essential because they make the app faster than manual calendar entry.

## 11.1 Swimming Lesson

Default preparation:

- Swimming kit
    
- Towel
    
- Goggles
    
- Water bottle
    

Default reminders:

- Morning of lesson
    
- Optional night before
    

Default resource:

- Car usually required
    

## 11.2 Gymnastics

Default preparation:

- Gymnastics kit
    
- Water bottle
    
- Check timing
    
- Competition note if relevant
    

Default resource:

- Car usually required
    

## 11.3 Beavers

Default preparation:

- Uniform
    
- Water bottle
    
- Any activity-specific item
    
- Check drop-off/pick-up location
    

Default resource:

- Car usually required
    

## 11.4 Birthday Party

Default preparation:

- RSVP
    
- Buy present
    
- Write card
    
- Check address
    
- Confirm drop-off or stay
    
- Check clothing/activity type
    

Default reminders:

- One week before for present
    
- Two days before for card
    
- Night before for address and timings
    
- Morning of party
    

## 11.5 Baby Group Block

Default preparation:

- Venue
    
- Session recurrence
    
- Equipment required
    
- Car required
    
- Parking notes
    
- Booking/payment note
    

Default reminders:

- Before first session in block
    
- Morning of each session
    
- Alert Phil if car conflict exists
    

## 11.6 Oracle Office Day

Default preparation:

- Laptop
    
- Charger
    
- Badge/pass
    
- Travel plan
    
- Meeting notes
    
- Customer/internal context
    
- Parking/train note
    

Default resource:

- Car maybe required
    

## 11.7 Vet Appointment

Default preparation:

- Lead/collar
    
- Appointment reason
    
- Medication/vaccination note
    
- Insurance/payment note
    
- Post-visit follow-up
    

Default resource:

- Car usually required
    

## 11.8 Dentist or Health Appointment

Default preparation:

- Appointment time
    
- Location
    
- Responsible adult
    
- Travel time
    
- Payment or forms if needed
    
- Follow-up reminder
    

## 11.9 School Special Day

Default preparation:

- Costume or clothing
    
- Payment
    
- Form
    
- Item to take
    
- Reading book or homework
    
- Lunch change if needed
    

---

## 12. Core Workflows

## 12.1 Add a Standard Event

User flow:

1. Tap Add Event.
    
2. Enter title.
    
3. Select category.
    
4. Select date/time.
    
5. Select people involved.
    
6. Select responsible adult.
    
7. Choose whether car is required.
    
8. Add prep tasks if needed.
    
9. Save.
    

The app should not force every field. It should allow quick creation with later completion.

## 12.2 Add an Event from Template

User flow:

1. Tap Add Event.
    
2. Choose template.
    
3. Confirm date/time.
    
4. Confirm participants.
    
5. Confirm responsible adult.
    
6. Review default prep tasks.
    
7. Save.
    

This should be the preferred route for common family activities.

## 12.3 Add a Recurring Club

User flow:

1. Select recurring event.
    
2. Choose template, such as Swimming or Gymnastics.
    
3. Set day, time and recurrence.
    
4. Set term-time or date range if required.
    
5. Confirm default responsible adult.
    
6. Confirm car need.
    
7. Save series.
    

The app should allow individual exceptions.

## 12.4 Add a Baby Group Block

User flow:

1. Select Baby Group Block template.
    
2. Add venue.
    
3. Set block start and end dates.
    
4. Set weekly recurrence.
    
5. Mark car required.
    
6. Add equipment notes.
    
7. Save block.
    

The app should immediately detect possible car conflicts.

## 12.5 Add an Oracle Office Day

User flow:

1. Select Oracle Office Day template.
    
2. Add office/customer location.
    
3. Set travel window.
    
4. Mark car required or maybe required.
    
5. Add prep notes.
    
6. Save.
    

The app should flag if the car is already required by Beck or for Seb.

## 12.6 Resolve a Car Clash

User flow:

1. Dashboard shows car clash.
    
2. User opens conflict.
    
3. App shows overlapping events.
    
4. User chooses resolution:
    
    - Confirm Phil does not need car.
        
    - Confirm Beck does not need car.
        
    - Adjust time.
        
    - Add note.
        
    - Mark acknowledged.
        
5. Conflict disappears or reduces severity.
    

## 12.7 Complete Preparation Tasks

User flow:

1. Open Today, Week or Prep view.
    
2. See outstanding tasks.
    
3. Tick off completed items.
    
4. Leave incomplete items visible until done, skipped or event completed.
    

## 12.8 Weekly Review

User flow:

1. Open Week view.
    
2. App highlights:
    
    - Busy days
        
    - Car needs
        
    - Conflicts
        
    - Unassigned responsibilities
        
    - Prep tasks due
        
3. Phil and Beck agree changes.
    
4. Tasks and responsibility fields are updated.
    

---

## 13. Primary Screens

## 13.1 Dashboard

Purpose:

Provide immediate family situational awareness.

Should show:

- Today
    
- Tomorrow
    
- Urgent prep
    
- Car conflicts
    
- Responsibility gaps
    
- Upcoming unusual events
    
- Quick add button
    

Dashboard sections:

1. Today
    
2. Needs attention
    
3. Car watch
    
4. Prep due
    
5. Coming up
    

## 13.2 Today

Purpose:

Answer “what needs to happen today?”

Should show:

- Timeline of events
    
- People involved
    
- Responsible adult
    
- Car needs
    
- Preparation checklist
    
- Warnings
    

## 13.3 Week

Purpose:

Answer “what does this week look like?”

Should show:

- Day-by-day event summary
    
- Busy day indicators
    
- Car required indicators
    
- Conflict badges
    
- Prep due indicators
    

## 13.4 Calendar

Purpose:

Browse the wider schedule.

Views:

- Day
    
- Week
    
- Month
    

The calendar should remain simple and not become the main operational interface.

## 13.5 Car

Purpose:

Make shared car usage impossible to miss.

Should show:

- Car bookings by day
    
- Needed from/until
    
- Allocated person
    
- Required or maybe status
    
- Clashes
    
- Unresolved transport notes
    

## 13.6 Prep

Purpose:

Central place for things that must not be forgotten.

Should show:

- Tasks due today
    
- Tasks due this week
    
- Critical tasks
    
- Tasks grouped by event
    
- Owner
    

## 13.7 People

Purpose:

Show each family member’s upcoming commitments.

Sub-views:

- Phil
    
- Beck
    
- Seb
    
- Albert
    

Each profile should show:

- Upcoming events
    
- Responsibilities
    
- Prep tasks
    
- Relevant reminders
    

## 13.8 Routines

Purpose:

Manage recurring events and blocks.

Should include:

- Clubs
    
- Lessons
    
- Baby Group blocks
    
- Regular appointments
    
- Weekly review
    
- School patterns
    

## 13.9 Templates

Purpose:

Create and manage reusable event starters.

MVP templates should be preloaded.

## 13.10 Settings

Purpose:

Manage app-level configuration.

Should include:

- Family members
    
- Resources
    
- Categories
    
- Places
    
- Import JSON
    
- Export JSON
    
- Reset local data
    
- App name/theme options
    

---

## 14. Conflict Detection Rules

## 14.1 Car Conflict

Trigger when:

- Two events require the same car.
    
- Their `neededFrom` and `neededUntil` windows overlap.
    
- Both are marked required, or one required and one maybe.
    

Severity:

- Critical when both are required.
    
- Warning when one is maybe.
    

## 14.2 Responsibility Conflict

Trigger when:

- The same adult is responsible for two overlapping events.
    
- Travel time makes the events impractical.
    
- One event involves Seb or Albert and no responsible adult is assigned.
    

## 14.3 Prep Overdue

Trigger when:

- A prep task is open.
    
- Its due date has passed.
    
- The event is still upcoming or active.
    

Severity:

- Critical if `blocksEvent` is true.
    
- Warning otherwise.
    

## 14.4 Tight Travel Gap

Trigger when:

- Consecutive events have different places.
    
- Time between events is less than estimated travel time plus buffer.
    

MVP can use rough travel minutes rather than live mapping.

## 14.5 Albert Care Gap

Trigger when:

- Albert is not attending an event.
    
- Both adults are away for a long period.
    
- A dog care check has not been added.
    

This should initially be a gentle warning, not a complex pet care engine.

---

## 15. Reminder Behaviour

Reminders should surface in the app first. Push notifications can be added later if architecture permits.

## 15.1 Reminder Types

- Same morning
    
- Night before
    
- Two days before
    
- One week before
    
- Custom
    
- Conditional
    

## 15.2 Conditional Reminders

Examples:

- Remind if birthday present not bought.
    
- Remind if car clash unresolved.
    
- Remind if responsible adult not assigned.
    
- Remind if event is tomorrow and critical prep remains open.
    

## 15.3 Reminder Recipients

Possible recipients:

- Phil
    
- Beck
    
- Both
    
- Responsible adult
    
- Task owner
    

---

## 16. Data Import and Export

The app should support JSON export from the start.

## 16.1 Export Requirements

Export should include:

- Household
    
- Family members
    
- Resources
    
- Places
    
- Events
    
- Event series
    
- Templates
    
- Prep tasks
    
- Reminders
    
- Settings
    

## 16.2 Import Requirements

Import should support:

- Full restore
    
- Preview before commit
    
- Validation before import
    
- Clear error messages
    
- No silent data loss
    

## 16.3 Backup Philosophy

The family schedule is operationally important. The app should make it easy to back up and restore data, especially if initially local-first.

---

## 17. Privacy and Safety Requirements

The app may hold sensitive family information, including:

- Child activities
    
- Locations
    
- Health and dentist appointments
    
- Vet appointments
    
- Travel plans
    
- Work travel
    
- Household routines
    

The product should therefore follow these principles:

- No unnecessary external sharing.
    
- No public URLs for private data.
    
- No analytics that expose family behaviour.
    
- No medical detail beyond appointment logistics unless explicitly needed.
    
- No child-facing sharing by default.
    
- Export data should be treated as sensitive.
    

---

## 18. Design Direction

The interface should feel:

- Calm
    
- Warm
    
- Practical
    
- Trustworthy
    
- Family-specific
    
- Quick to scan
    
- Mobile-native
    
- Not childish
    
- Not corporate
    

Suggested visual direction:

- Warm neutral background
    
- Soft cards
    
- Clear typography
    
- Colour-coded family members
    
- Clear badges for car, prep and responsibility
    
- High-contrast warnings only where useful
    

The design should support daily use, not novelty.

---

## 19. MVP Acceptance Criteria

The MVP can be considered successful when the following are true.

## 19.1 Event Management

- A user can create, edit and delete an event.
    
- A user can assign family members to an event.
    
- A user can assign a responsible adult.
    
- A user can add a place.
    
- A user can mark whether the car is required.
    

## 19.2 Preparation

- A user can add preparation tasks to an event.
    
- A user can tick tasks as done.
    
- Overdue tasks are visible.
    
- Critical incomplete tasks are highlighted.
    

## 19.3 Car Planning

- The app shows when the family car is needed.
    
- The app detects overlapping car needs.
    
- The app distinguishes required and maybe required car usage.
    

## 19.4 Recurring Events

- A user can create a recurring event series.
    
- Individual occurrences can be changed or cancelled.
    
- Default prep tasks can be applied to recurring events.
    

## 19.5 Dashboard

- The dashboard shows today’s events.
    
- The dashboard shows urgent prep tasks.
    
- The dashboard shows conflicts.
    
- The dashboard shows upcoming unusual events.
    

## 19.6 Templates

- A user can create an event from a template.
    
- The template applies default prep tasks and reminders.
    

## 19.7 Data Safety

- A user can export data to JSON.
    
- A user can import JSON with preview and validation.
    
- Bad imports do not silently corrupt existing data.
    

---

## 20. Realistic Week Validation

The proposed model must support a week containing:

- School days.
    
- Seb gymnastics.
    
- Seb swimming.
    
- Beavers or cricket.
    
- Beck Baby Group session.
    
- Phil Oracle office/customer day.
    
- Albert vet appointment.
    
- Birthday party.
    
- Family social activity.
    
- Weekly review.
    
- School week preparation.
    

The model supports this without additional entities.

Required data objects:

- Event
    
- Family member
    
- Place
    
- Resource
    
- Resource need
    
- Prep task
    
- Reminder
    
- Event series
    
- Template
    
- Conflict
    

No further MVP data objects are justified at this stage.

---

## 21. Risks

## 21.1 Too much manual entry

Risk:

The app becomes more effort than benefit.

Mitigation:

- Use templates.
    
- Support quick add.
    
- Allow partial entry.
    
- Make recurring events easy.
    

## 21.2 Becoming another generic calendar

Risk:

The product loses its reason to exist.

Mitigation:

- Keep focus on car, prep, responsibility and conflict detection.
    
- Make Dashboard, Car and Prep views more important than month calendar.
    

## 21.3 Notification fatigue

Risk:

The app becomes noisy.

Mitigation:

- Prioritise meaningful warnings.
    
- Use conditional reminders.
    
- Avoid excessive default alerts.
    

## 21.4 Local data loss

Risk:

Local-first storage could be lost if not backed up.

Mitigation:

- Make export prominent.
    
- Add backup reminders.
    
- Consider later cloud sync.
    

## 21.5 Scope creep

Risk:

The app expands into chores, meals, chat, budgeting and contacts.

Mitigation:

- Treat those as future modules only.
    
- Protect MVP around logistics readiness.
    

---

## 22. Future Enhancements

Future features may include:

- Shared Phil and Beck access.
    
- Push notifications.
    
- iCloud or Google Calendar import.
    
- Natural language event creation.
    
- AI schedule review.
    
- Alexa or Home Assistant integration.
    
- Child-friendly Seb view.
    
- Tablet family command board.
    
- Holiday mode.
    
- Link to Properly Packed.
    
- Gift tracking.
    
- School term import.
    
- Baby Group block import.
    
- Smart weekly planning assistant.
    
- “What are we forgetting?” review mode.
    

These should be considered after the MVP proves useful.

---

## 23. Product Boundary Statement

The Lawrence Family Organiser is:

> A private family logistics PWA that helps Phil and Beck manage events, responsibility, car usage, preparation tasks, recurring routines and practical conflicts across the Lawrence household.

It is not:

- A generic shared calendar.
    
- A chore app.
    
- A meal planner.
    
- A family messaging app.
    
- A full personal productivity system.
    
- A replacement for every existing calendar from day one.
    

The app should do fewer things well.

---

## 24. Recommended Next Step

The next artefact should be:

**Technical Architecture v0.1**

That document should define:

- App structure
    
- Storage approach
    
- Local-first model
    
- PWA requirements
    
- Data schema
    
- Import/export strategy
    
- Notification approach
    
- Conflict detection logic
    
- Future sync path
    
- Build phases
    

The architecture should protect the simplicity of this specification while leaving enough room for future shared access and notifications.
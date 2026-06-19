# Lawrence Family Organiser PWA

## Early Product Specification v0.1

## 1. Product Purpose

The Lawrence Family Organiser is a private, mobile-first PWA designed around the real operating rhythm of a family consisting of two parents, one child and one dog.

The app exists to reduce missed details, avoid avoidable clashes, and make recurring family logistics easier to manage. It should not try to replace every calendar, notes app or task manager immediately. Its value comes from understanding the specific patterns of the Lawrence household.

The primary purpose is:

> To help the family know what is happening, who needs to be where, what needs preparing, who needs the car, and what must not be forgotten.

## 2. Why Existing Apps Are Not Enough

Generic family organiser apps tend to assume relatively standard use cases:

- Shared calendar
    
- Shopping lists
    
- Chores
    
- Meal planning
    
- Reminders
    
- Basic family messaging
    

The Lawrence Family problem is more specific.

Key pain points include:

- Car usage is usually simple, but occasionally becomes critical and easy to forget.
    
- Beck mostly works from home, but periodically attends Baby Groups across the area in blocks.
    
- Phil mostly works from home, but has variable in-person Oracle meetings, office visits and travel.
    
- Seb has a busy and recurring club, lesson, school and social calendar.
    
- Albert has periodic vet, grooming, care and routine needs.
    
- Health, dentist, school, birthday parties and family admin all create sporadic obligations.
    
- Many events are not just “be there at 4pm”; they require preparation, travel, kit, payment, forms, clothes, snacks, gifts or handover between parents.
    

The app should therefore focus on **family logistics**, not just event storage.

## 3. Core Product Principles

### 3.1 Mobile-first

The primary device is likely to be an iPhone. The interface should work well one-handed and support rapid entry.

### 3.2 Household-specific

The app should be structured around Phil, Beck, Seb and Albert, not generic “members”.

### 3.3 Calendar-plus, not calendar-only

Events should have useful operational metadata: car need, travel, kit, preparation, responsible adult, reminders, payment, status and follow-up.

### 3.4 Calm by default

The app should not become noisy. It should highlight meaningful conflicts and forgotten preparation, not spam the family.

### 3.5 Private and local-first where practical

Family routines, children’s activities, travel, appointments and health-related notes are sensitive. A local-first or self-hosted model should be considered from the outset.

### 3.6 Fast capture

Adding an event should be quick. The app should support “rough now, refine later”.

## 4. Family Members and Roles

### Phil

Typical needs:

- Oracle office days
    
- Customer meetings
    
- Travel days
    
- Car requirements
    
- School run visibility
    
- Family logistics oversight
    
- Tech/admin reminders
    

### Beck

Typical needs:

- Baby Group blocks
    
- Photography-related commitments
    
- School and social organisation
    
- Car requirements during non-standard weeks
    
- Family preparation and reminders
    

### Seb

Typical needs:

- School events
    
- Clubs and lessons
    
- Birthday parties
    
- Playdates
    
- Homework or themed school days
    
- Kit reminders
    
- Transport needs
    
- Parent responsibility
    

### Albert

Typical needs:

- Vet appointments
    
- Grooming or care reminders
    
- Medication or treatment reminders if ever required
    
- Walk or care coverage during long family days
    
- Holiday/staycation considerations
    

## 5. Primary Use Cases

### 5.1 “Who needs the car?”

The app should make car dependency explicit.

Each event should optionally record:

- Car required: yes/no/maybe
    
- Which car, if relevant
    
- Driver
    
- Passenger(s)
    
- Departure time
    
- Return time
    
- Clash risk
    
- Alternative transport note
    

The app should detect when Phil and Beck both need the car at overlapping times.

### 5.2 “What is happening today?”

A Today view should show:

- Events by person
    
- School run impact
    
- Car needs
    
- Items to prepare
    
- Time-sensitive reminders
    
- Weather-sensitive notes if added later
    
- Unresolved conflicts
    

### 5.3 “What do we need to remember?”

Events should support preparation items.

Examples:

- Take swimming kit
    
- Pack gymnastics leotard
    
- Buy birthday present
    
- Fill water bottle
    
- Take school reading book
    
- Charge camera battery
    
- Take dog vaccination record
    
- Bring cash or payment card
    
- Complete form
    
- Confirm attendance
    

### 5.4 “Who is responsible?”

Events should have a responsible adult or shared responsibility.

Example values:

- Phil
    
- Beck
    
- Either
    
- Both
    
- External / school / club
    

### 5.5 “What repeats?”

The app should support recurring patterns but allow exceptions.

Examples:

- Weekly swimming
    
- Weekly gymnastics
    
- Beavers
    
- Cricket season
    
- Baby Group blocks
    
- School term dates
    
- Dentist every six months
    
- Annual dog vaccinations
    

### 5.6 “What has changed this week?”

A weekly planning view should highlight anything unusual.

Examples:

- Beck needs the car on Tuesday morning
    
- Phil is in London on Wednesday
    
- Seb has a birthday party on Saturday
    
- Albert has a vet appointment
    
- Swimming is cancelled during half-term
    
- Baby Group block starts again
    

## 6. MVP Scope

The first useful version should avoid becoming too broad. MVP should focus on the areas most likely to prevent real-world failures.

### MVP Feature Set

1. Family dashboard
    
2. Today view
    
3. Week view
    
4. Add/edit event
    
5. Family member assignment
    
6. Car requirement tracking
    
7. Preparation checklist per event
    
8. Responsible adult field
    
9. Recurring event support
    
10. Conflict detection
    
11. Reminder rules
    
12. Category tagging
    
13. Simple search
    
14. Import/export JSON
    
15. Local storage or lightweight database foundation
    

## 7. Suggested Navigation

### Dashboard

A family command centre showing today, tomorrow and urgent preparation items.

### Calendar

A mobile-friendly day/week/month view.

### People

Views for Phil, Beck, Seb and Albert.

### Car

A focused view for car usage, conflicts and planned travel.

### Prep

All outstanding things to pack, buy, complete, charge or remember.

### Routines

Recurring commitments, term-time patterns and repeatable blocks.

### Admin

Data import/export, settings, categories, templates and backup.

## 8. Event Model

Each event should support the following fields.

### Basic Fields

- Title
    
- Description
    
- Start date/time
    
- End date/time
    
- All-day flag
    
- Location
    
- Category
    
- Family member(s)
    
- Responsible adult
    
- Status
    

Suggested statuses:

- Planned
    
- Confirmed
    
- Tentative
    
- Cancelled
    
- Completed
    

### Logistics Fields

- Car required
    
- Driver
    
- Departure time
    
- Return time
    
- Travel notes
    
- Parking notes
    
- Cost/payment note
    
- Booking reference
    
- Contact name
    
- Contact details
    

### Preparation Fields

Each event may have checklist items.

Checklist item fields:

- Item text
    
- Assigned to
    
- Due date/time
    
- Completed
    
- Critical flag
    

Example critical items:

- Present purchased
    
- Party address checked
    
- Swimming kit packed
    
- Camera batteries charged
    
- Car available
    
- Medical form completed
    

### Reminder Fields

- Reminder time(s)
    
- Reminder type
    
- Reminder recipient
    
- Escalation rule
    

Example reminder rules:

- Remind the responsible adult the night before.
    
- Remind both parents if a car clash exists.
    
- Remind Phil if the event requires charging a device.
    
- Remind Beck if the event relates to Baby Group logistics.
    
- Remind both parents for health, dentist, school or vet appointments.
    

## 9. Categories

Suggested initial categories:

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
    

## 10. Templates

Templates will make the app much more useful than a generic calendar.

Suggested templates:

### Swimming Lesson

Default prep:

- Swimming kit
    
- Towel
    
- Goggles
    
- Water bottle
    
- Check stage/progress note
    

### Gymnastics

Default prep:

- Gymnastics kit
    
- Water bottle
    
- Hair/clothing check if needed
    
- Competition note if relevant
    

### Birthday Party

Default prep:

- RSVP
    
- Buy present
    
- Write card
    
- Check address
    
- Check drop-off/pick-up details
    

### Baby Group Block

Default prep:

- Venue
    
- Start/end date
    
- Session recurrence
    
- Equipment required
    
- Car required
    
- Booking/payment note
    

### Oracle Office Day

Default prep:

- Travel time
    
- Train/parking note
    
- Laptop
    
- Charger
    
- Badge/pass
    
- Customer or internal meeting context
    

### Vet Appointment

Default prep:

- Appointment reason
    
- Medication/vaccination note
    
- Insurance/payment note
    
- Lead/collar
    
- Post-visit follow-up
    

## 11. Views That Matter

### 11.1 Today View

Should answer:

- What is happening today?
    
- Who is involved?
    
- Who is responsible?
    
- Does anyone need the car?
    
- What needs preparing?
    
- What could be forgotten?
    

### 11.2 Week View

Should answer:

- What is unusual this week?
    
- Are there car conflicts?
    
- Are there preparation tasks due?
    
- Which days are heavy?
    
- Which parent is carrying most logistics?
    

### 11.3 Car View

Should answer:

- Who needs the car?
    
- When is the car unavailable?
    
- Are there clashes?
    
- Is an event still marked “maybe” for car need?
    

### 11.4 Seb View

Should answer:

- What clubs, lessons, school events and social plans does Seb have?
    
- What kit is needed?
    
- Which parent is responsible?
    
- Are there forms, payments or gifts outstanding?
    

### 11.5 Beck Baby Group View

Should answer:

- Which block is active?
    
- Which venue is next?
    
- What times does Beck need the car?
    
- Are there location or equipment notes?
    

### 11.6 Albert View

Should answer:

- What appointments or care tasks are upcoming?
    
- Are vaccinations, treatments or checks due?
    
- Does Albert need care coverage when the family is out?
    

## 12. Conflict Detection

The app should detect practical conflicts rather than abstract calendar overlaps only.

### Conflict types

- Car conflict
    
- Parent responsibility conflict
    
- Location/travel conflict
    
- Preparation overdue
    
- Double booking
    
- Child activity clash
    
- Work/family clash
    
- Dog care gap
    

### Examples

- Phil is marked as responsible for Seb’s swimming, but also has an Oracle office day.
    
- Beck needs the car for Baby Group, but Phil has a customer meeting requiring travel.
    
- A birthday party is tomorrow and no present is marked as bought.
    
- Albert has a vet appointment while both adults are away.
    
- Seb has a school event requiring costume, but no prep task exists.
    

## 13. Reminder Philosophy

Reminders should be intelligent and tied to context.

Preferred reminder types:

- Same morning
    
- Night before
    
- Two days before
    
- One week before
    
- Custom
    
- Escalation when incomplete
    

Examples:

- Birthday party: remind one week before to buy present, night before to wrap it, morning of to take it.
    
- Baby Group block: remind at the start of the block and before each session.
    
- Car clash: alert both parents as soon as the clash is created.
    
- Vet appointment: remind one week before and morning of.
    
- Oracle office day: remind Phil the night before to prepare travel kit.
    

## 14. Potential Future Features

These should not distract from MVP.

- Shared access for Phil and Beck
    
- iCloud/Google calendar import or sync
    
- Push notifications
    
- Home screen widgets
    
- Voice capture
    
- Natural language event creation
    
- AI-assisted schedule review
    
- School term date import
    
- Club timetable import
    
- Contact directory
    
- Gift tracking
    
- Birthday party RSVP tracking
    
- Packing link to the separate family packing PWA
    
- Holiday mode
    
- Dog care mode
    
- Family command board for tablet display
    
- Alexa/Home Assistant integration
    

## 15. Technical Direction

Likely implementation direction:

- Mobile-first PWA
    
- React/Vite or equivalent frontend
    
- Local-first storage initially
    
- Structured JSON import/export
    
- Later optional backend
    
- Later authenticated multi-user sync
    
- Installable on iPhone home screen
    
- Designed for quick entry and quick review
    

The app should be built as a product with clean data structures from the start, even if the first implementation stores data locally.

## 16. Design Tone

The interface should feel:

- Calm
    
- Useful
    
- Family-specific
    
- Fast
    
- Clear
    
- Slightly warm, but not childish
    
- Practical rather than decorative
    

The app is for parents first, with future potential for Seb-friendly views.

## 17. MVP Success Criteria

The MVP is successful if it helps prevent these real problems:

- Both parents needing the car unexpectedly
    
- Missing a club kit or lesson item
    
- Forgetting a birthday party present or card
    
- Missing a vet, dentist or health appointment
    
- Failing to notice an unusually busy week
    
- Losing track of who is responsible for an event
    
- Forgetting preparation for a non-routine event
    

The MVP should feel valuable even before advanced AI, external calendar sync or push notifications are added.

## 18. Open Design Questions

1. Should this app eventually sync with existing calendars, or should it be the master family logistics layer?
    
2. Should Phil and Beck both have separate logins, or should v1 assume a shared household device/account?
    
3. Should Seb have a child-friendly read-only view?
    
4. Should Albert’s needs be treated as a full family member profile or as a care category?
    
5. Should the car be treated as a shared resource with its own calendar?
    
6. Should reminders be device-local only at first, or should push notifications be a v1 requirement?
    
7. Should the first version prioritise manual entry, templates, or calendar import?
    
8. Should events have “prep checklists” by default, or only when a template is used?
    
9. Should the app include family routines such as school mornings and bedtime, or remain focused on scheduled events?
    
10. Should the app later link to the proposed packing assistant for holidays, cruises and short breaks?
    

## 19. Recommended First Build Boundary

The first build should be:

> A private mobile-first family logistics PWA with calendar views, family member assignment, car tracking, recurring events, event preparation checklists and conflict detection.

It should not yet try to be:

- A full household chore system
    
- A meal planner
    
- A family chat app
    
- A school portal
    
- A complete CRM for family contacts
    
- A replacement for every external calendar
    
- A general-purpose productivity app
    

The strongest first version is one that solves the Lawrence Family’s actual coordination failures.
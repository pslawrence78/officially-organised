# Lawrence Family Organiser PWA

## Core Data Model and Realistic Week Test v0.1

## 1. Design Aim

The core data model should answer six practical questions:

1. What is happening?
    
2. Who is involved?
    
3. Who is responsible?
    
4. What needs preparing?
    
5. Does anyone need the car?
    
6. Is there a clash or forgotten action?
    

Anything outside those six questions should be treated as optional or future scope.

---

# 2. Core Data Model

## 2.1 Household

The household is the top-level container.

### Household fields

|Field|Purpose|
|---|---|
|`id`|Unique household identifier|
|`name`|Example: Lawrence Family|
|`timezone`|Europe/London|
|`defaultStartOfWeek`|Monday|
|`createdAt`|Audit field|
|`updatedAt`|Audit field|

### Example

```json
{
  "id": "household_lawrence",
  "name": "Lawrence Family",
  "timezone": "Europe/London",
  "defaultStartOfWeek": "monday"
}
```

This should remain simple. The household should not become a complex profile.

---

## 2.2 Family Member

A family member represents Phil, Beck, Seb or Albert.

Albert should be modelled as a family member with `memberType: "pet"`, not hidden away as a category. This allows vet appointments, care needs and holiday logistics to work naturally.

### Family Member fields

|Field|Purpose|
|---|---|
|`id`|Unique identifier|
|`displayName`|Phil, Beck, Seb, Albert|
|`memberType`|adult, child, pet|
|`colour`|Optional UI colour|
|`defaultResponsibleAdults`|Useful for Seb or Albert|
|`active`|Allows future archival without deleting history|

### Example

```json
{
  "id": "member_seb",
  "displayName": "Seb",
  "memberType": "child",
  "defaultResponsibleAdults": ["member_phil", "member_beck"],
  "active": true
}
```

### Initial members

|Member|Type|Notes|
|---|---|---|
|Phil|Adult|Work, travel, family logistics|
|Beck|Adult|Work, Baby Groups, photography, school/social logistics|
|Seb|Child|School, clubs, parties, lessons|
|Albert|Pet|Vet, care, walks, holiday planning|

---

## 2.3 Resource

A resource is something that can be needed, reserved or clashed over.

For v0.1, the main resource is the car. The model should allow other resources later without overengineering.

### Resource fields

|Field|Purpose|
|---|---|
|`id`|Unique identifier|
|`name`|Example: Family car|
|`resourceType`|car, equipment, room, other|
|`shared`|Whether clashes matter|
|`active`|Whether still used|

### Example

```json
{
  "id": "resource_family_car",
  "name": "Family car",
  "resourceType": "car",
  "shared": true,
  "active": true
}
```

The car should have its own view because it is one of the clearest real-world failure points.

---

## 2.4 Place

A place is a reusable venue or location.

This avoids repeatedly typing the same locations and makes travel time, parking notes and directions easier later.

### Place fields

|Field|Purpose|
|---|---|
|`id`|Unique identifier|
|`name`|Venue name|
|`placeType`|school, club, medical, vet, office, home, social, other|
|`address`|Optional|
|`postcode`|Optional|
|`travelNotes`|Parking, entrance, drop-off instructions|
|`defaultTravelMinutes`|Optional rough travel time from home|

### Example

```json
{
  "id": "place_joe_fraser_gymnastics",
  "name": "Joe Fraser Gymnastics Club Lichfield",
  "placeType": "club",
  "defaultTravelMinutes": 15,
  "travelNotes": "Check parking and arrive slightly early for drop-off."
}
```

Places should be useful but lightweight. Full contact records should be future scope.

---

## 2.5 Category

Categories are controlled labels used for filtering, templates and visual grouping.

### Suggested v0.1 categories

```json
[
  "school",
  "club",
  "lesson",
  "birthday_party",
  "playdate",
  "family_social",
  "medical",
  "dentist",
  "vet",
  "work",
  "travel",
  "baby_group",
  "photography",
  "dog_care",
  "household_admin",
  "reminder_only"
]
```

Categories should be simple enums at first, not user-managed database objects.

---

## 2.6 Event

The event is the central object.

An event should not merely say “Swimming, 5pm”. It should also hold responsibility, preparation and resource requirements.

### Event fields

|Field|Purpose|
|---|---|
|`id`|Unique identifier|
|`title`|Event title|
|`category`|Controlled category|
|`status`|planned, confirmed, tentative, cancelled, completed|
|`startAt`|Start date/time|
|`endAt`|End date/time|
|`allDay`|True/false|
|`placeId`|Optional linked place|
|`participants`|Phil, Beck, Seb, Albert|
|`responsibleAdults`|Phil, Beck, either, both|
|`resourceNeeds`|Car or other shared resource needs|
|`prepTasks`|Embedded or linked checklist items|
|`reminders`|Reminder rules|
|`notes`|Practical notes|
|`seriesId`|Optional recurring series|
|`createdFromTemplateId`|Optional template link|
|`createdAt`|Audit field|
|`updatedAt`|Audit field|

### Example

```json
{
  "id": "event_seb_gymnastics_2026_06_22",
  "title": "Seb gymnastics",
  "category": "club",
  "status": "confirmed",
  "startAt": "2026-06-22T17:00:00+01:00",
  "endAt": "2026-06-22T18:00:00+01:00",
  "allDay": false,
  "placeId": "place_joe_fraser_gymnastics",
  "participants": ["member_seb"],
  "responsibleAdults": ["member_phil"],
  "resourceNeeds": [
    {
      "resourceId": "resource_family_car",
      "needStatus": "required",
      "neededFrom": "2026-06-22T16:35:00+01:00",
      "neededUntil": "2026-06-22T18:20:00+01:00",
      "allocatedTo": "member_phil"
    }
  ],
  "prepTasks": [
    {
      "title": "Pack gymnastics kit",
      "owner": "member_phil",
      "dueAt": "2026-06-22T16:00:00+01:00",
      "priority": "important",
      "status": "open"
    },
    {
      "title": "Fill water bottle",
      "owner": "member_phil",
      "dueAt": "2026-06-22T16:00:00+01:00",
      "priority": "normal",
      "status": "open"
    }
  ],
  "reminders": [
    {
      "audience": ["member_phil"],
      "trigger": "same_day_morning",
      "reason": "Gymnastics kit needed"
    }
  ],
  "notes": "Check whether Jodie is attending this week."
}
```

---

## 2.7 Resource Need

Resource needs should be embedded inside events rather than treated as separate events.

### Resource Need fields

|Field|Purpose|
|---|---|
|`resourceId`|Example: family car|
|`needStatus`|required, maybe, not_required|
|`neededFrom`|Start of actual resource need|
|`neededUntil`|End of actual resource need|
|`allocatedTo`|Who needs or uses it|
|`notes`|Transport notes|

### Why this matters

The event might run from 10:00 to 11:00, but the car may be needed from 09:20 to 11:30. This is essential for avoiding real clashes.

---

## 2.8 Prep Task

Prep tasks are one of the app’s main differentiators.

### Prep Task fields

|Field|Purpose|
|---|---|
|`id`|Unique task identifier if stored separately|
|`eventId`|Parent event|
|`title`|What needs doing|
|`owner`|Phil, Beck, either, both|
|`dueAt`|When it should be done|
|`priority`|normal, important, critical|
|`status`|open, done, skipped|
|`blocksEvent`|Whether the event is at risk if incomplete|
|`notes`|Optional detail|

### Example

```json
{
  "title": "Buy birthday present",
  "owner": "member_beck",
  "dueAt": "2026-06-26T18:00:00+01:00",
  "priority": "critical",
  "status": "open",
  "blocksEvent": true
}
```

Prep tasks should not become a general task manager. They should usually belong to an event.

---

## 2.9 Reminder

Reminders should explain why they exist.

### Reminder fields

|Field|Purpose|
|---|---|
|`audience`|Who should be reminded|
|`trigger`|Fixed or relative trigger|
|`reason`|Human-readable reminder reason|
|`condition`|Optional condition, such as task still open|

### Example

```json
{
  "audience": ["member_phil", "member_beck"],
  "trigger": "one_day_before",
  "reason": "Car required and responsibility confirmed",
  "condition": "resource_need_exists"
}
```

The app should support reminders even before true push notifications exist. At first, they can surface in the app dashboard.

---

## 2.10 Event Series

Recurring commitments should use an event series.

This avoids duplicating the same information while still allowing exceptions.

### Event Series fields

|Field|Purpose|
|---|---|
|`id`|Unique identifier|
|`title`|Example: Seb swimming|
|`category`|Category|
|`recurrenceRule`|Weekly, monthly, custom|
|`defaultPlaceId`|Usual venue|
|`defaultParticipants`|Usual people|
|`defaultResponsibleAdults`|Usual adult owner|
|`defaultResourceNeeds`|Typical car need|
|`defaultPrepTasks`|Usual checklist|
|`exceptions`|Cancelled, moved or changed dates|

### Example

```json
{
  "id": "series_seb_swimming",
  "title": "Seb swimming",
  "category": "lesson",
  "recurrenceRule": {
    "frequency": "weekly",
    "dayOfWeek": "wednesday",
    "startTime": "17:30",
    "durationMinutes": 30,
    "termTimeOnly": true
  },
  "defaultParticipants": ["member_seb"],
  "defaultResponsibleAdults": ["member_phil", "member_beck"],
  "defaultResourceNeeds": [
    {
      "resourceId": "resource_family_car",
      "needStatus": "required",
      "offsetBeforeMinutes": 25,
      "offsetAfterMinutes": 20
    }
  ],
  "defaultPrepTasks": [
    "Pack swimming kit",
    "Pack towel",
    "Pack goggles",
    "Fill water bottle"
  ]
}
```

---

## 2.11 Template

Templates should help create high-quality events quickly.

### Template fields

|Field|Purpose|
|---|---|
|`id`|Unique identifier|
|`name`|Template name|
|`category`|Default category|
|`defaultDurationMinutes`|Suggested length|
|`defaultParticipants`|Optional|
|`defaultResourceNeeds`|Optional|
|`defaultPrepTasks`|Reusable checklist|
|`defaultReminders`|Sensible reminders|

### Initial templates

|Template|Why it matters|
|---|---|
|Swimming lesson|Kit-heavy, recurring|
|Gymnastics|Kit and timing|
|Birthday party|RSVP, present, card, address|
|Baby Group session|Block-based, car-sensitive|
|Oracle office day|Work travel and prep|
|Vet appointment|Albert care and follow-up|
|Dentist appointment|Periodic family health|
|School special day|Costume, payment, form or item|

---

## 2.12 Conflict

Conflicts should be generated by the app, not manually entered.

### Conflict fields

|Field|Purpose|
|---|---|
|`id`|Unique identifier|
|`conflictType`|car, responsibility, travel, prep, double_booking, care_gap|
|`severity`|info, warning, critical|
|`relatedEventIds`|Events involved|
|`message`|Human-readable explanation|
|`resolutionStatus`|open, acknowledged, resolved|
|`suggestedAction`|Optional|

### Example

```json
{
  "conflictType": "car",
  "severity": "critical",
  "relatedEventIds": [
    "event_beck_baby_group_2026_06_23",
    "event_phil_oracle_meeting_2026_06_23"
  ],
  "message": "Both Phil and Beck need the family car on Tuesday morning.",
  "resolutionStatus": "open",
  "suggestedAction": "Confirm whether Phil can use train/taxi or whether Beck can adjust travel."
}
```

Conflict storage can be optional in v0.1. The app could calculate conflicts live at first.

---

# 3. Minimum Viable Data Objects

The MVP only needs these objects:

1. Household
    
2. Family Member
    
3. Resource
    
4. Place
    
5. Event
    
6. Event Series
    
7. Template
    
8. Prep Task
    
9. Reminder
    
10. Conflict
    

That is enough. Anything more should justify itself against a real family scenario.

---

# 4. Realistic Lawrence Week Test

## Assumed week

This test week is fictional but realistic.

Family context:

- Phil mostly works from home, with one Oracle office/customer day.
    
- Beck mostly works from home, with one Baby Group block session.
    
- Seb has school and several activities.
    
- Albert has a vet appointment.
    
- There is one birthday party at the weekend.
    
- The family car is the key shared resource.
    

---

## Monday

### Events

|Time|Event|People|Resource|Prep|
|---|---|---|---|---|
|School day|Seb at school|Seb|None|Reading book, water bottle|
|17:00–18:00|Seb gymnastics|Seb, Phil|Car required|Gym kit, water bottle|
|Evening|Family admin reminder|Phil, Beck|None|Review week|

### Data model test

Captured by:

- `Event`
    
- `Place`
    
- `ResourceNeed`
    
- `PrepTask`
    
- `Reminder`
    

### Useful app behaviour

Dashboard should show:

- Seb gymnastics today.
    
- Phil responsible.
    
- Car needed 16:35–18:20.
    
- Gym kit and water bottle outstanding until checked off.
    

### Bloat check

No extra object needed.

---

## Tuesday

### Events

|Time|Event|People|Resource|Prep|
|---|---|---|---|---|
|09:30–11:30|Beck Baby Group session|Beck|Car required|Equipment, venue note|
|10:00–13:00|Phil Oracle customer meeting|Phil|Car maybe required|Laptop, charger, travel plan|
|18:00–19:00|Beavers|Seb, Beck|Car required|Uniform, water bottle|

### Data model test

Captured by:

- `Event`
    
- `EventSeries`, if Baby Group is part of a block
    
- `ResourceNeed`
    
- `Conflict`
    
- `PrepTask`
    

### Useful app behaviour

The app should flag:

> Car clash: Beck needs the family car for Baby Group while Phil may need it for an Oracle meeting.

The clash should appear before Tuesday morning, not at the moment everyone is trying to leave.

### Required fields that prove their value

- `needStatus: "maybe"` for Phil’s car need
    
- `neededFrom` and `neededUntil`, not just event start/end
    
- `responsibleAdults`
    
- `suggestedAction`
    

### Bloat check

No need for a full transport module. A simple `ResourceNeed` object is enough.

---

## Wednesday

### Events

|Time|Event|People|Resource|Prep|
|---|---|---|---|---|
|School day|School special item needed|Seb|None|Take PE kit or reading book|
|17:30–18:00|Seb swimming|Seb, Phil or Beck|Car required|Swimming kit, towel, goggles|
|Evening|Dentist reminder|Phil, Beck|None|Book/check next appointments|

### Data model test

Captured by:

- `EventSeries`
    
- `PrepTask`
    
- `Reminder`
    
- `responsibleAdults: ["either"]` or both adults until confirmed
    

### Useful app behaviour

The app should show swimming as routine but still surface the preparation checklist.

It should also flag if responsibility is unclear:

> Seb swimming has no confirmed responsible adult.

### Bloat check

A separate “handover” model is not needed yet. `responsibleAdults` plus status is enough.

---

## Thursday

### Events

|Time|Event|People|Resource|Prep|
|---|---|---|---|---|
|08:30–18:00|Phil Oracle office day|Phil|Car or train, depending location|Laptop, badge, charger|
|15:30–16:30|Playdate after school|Seb, Beck|Car maybe required|Confirm pick-up details|
|17:00|Albert vet appointment|Albert, Beck|Car required|Lead, appointment reason, payment|

### Data model test

Captured by:

- `Event`
    
- `ResourceNeed`
    
- `PrepTask`
    
- `Conflict`
    
- `Place`
    

### Useful app behaviour

The app should flag a potential risk:

> Beck has a playdate pick-up and Albert’s vet appointment close together. Check travel time and responsibility.

This is not simply a calendar overlap. It is a practical family logistics issue.

### Required fields that prove their value

- `placeId`
    
- `defaultTravelMinutes`
    
- `responsibleAdults`
    
- `participants`
    
- `resourceNeeds`
    

### Bloat check

Travel time can be a simple rough field. No need for live routing in MVP.

---

## Friday

### Events

|Time|Event|People|Resource|Prep|
|---|---|---|---|---|
|School day|Seb school|Seb|None|Normal school items|
|17:30–18:30|Cricket or seasonal club|Seb, Phil|Car required|Cricket kit, water bottle|
|Evening|Birthday party prep|Phil, Beck|None|Buy present, write card|

### Data model test

Captured by:

- `EventSeries`
    
- `PrepTask`
    
- `Reminder`
    
- `Template`
    

### Useful app behaviour

The app should show:

- Club kit needed.
    
- Birthday present still open.
    
- Birthday card still open.
    
- Party address should be checked before Saturday.
    

### Bloat check

Gift tracking does not need to be a standalone feature yet. Birthday party prep tasks are enough.

---

## Saturday

### Events

|Time|Event|People|Resource|Prep|
|---|---|---|---|---|
|10:30–12:30|Seb birthday party|Seb, Beck|Car required|Present, card, address|
|14:00–16:00|Family social / park|All|Car maybe required|Weather note, dog plan|
|Afternoon|Albert care check|Albert|None|Walk coverage|

### Data model test

Captured by:

- `Birthday Party Template`
    
- `PrepTask`
    
- `ResourceNeed`
    
- `Reminder`
    
- `Dog care category`
    

### Useful app behaviour

The app should flag on Friday evening:

> Birthday party tomorrow. Present and card not marked complete.

The app should also show whether Albert needs a walk before or after the family is out.

### Bloat check

A full pet care module is not needed. Albert as a family member plus event/prep coverage is sufficient.

---

## Sunday

### Events

|Time|Event|People|Resource|Prep|
|---|---|---|---|---|
|Morning|Family downtime|All|None|None|
|Afternoon|Weekly review|Phil, Beck|None|Check next week|
|Evening|School week prep|Seb, Phil, Beck|None|Uniform, bag, reading, clubs|

### Data model test

Captured by:

- `Reminder`
    
- `PrepTask`
    
- `Event`
    
- Maybe a recurring weekly review series
    

### Useful app behaviour

The app should show a next-week readiness view:

- Beck has Baby Group block Tuesday.
    
- Phil has office travel Thursday.
    
- Seb has swimming and gymnastics.
    
- Albert has no appointments.
    
- Car clashes: none or unresolved.
    
- Prep tasks due before Monday morning.
    

### Bloat check

No need for a full “weekly planning module” yet. A filtered dashboard can provide the same outcome.

---

# 5. Model Stress Test

## Does the model capture the week?

Yes.

The week can be captured with:

- Family members
    
- Events
    
- Recurring series
    
- Places
    
- Car/resource needs
    
- Prep tasks
    
- Reminders
    
- Conflict detection
    

No additional major entity is required.

---

## Fields that clearly earn their place

|Field/Object|Why it earns its place|
|---|---|
|`FamilyMember`|Needed for Phil, Beck, Seb and Albert views|
|`Resource`|Needed because car clashes are a real problem|
|`ResourceNeed`|More accurate than basic calendar overlap|
|`PrepTask`|Prevents forgotten kit, gifts, forms and items|
|`responsibleAdults`|Prevents ambiguity|
|`Place`|Supports travel, parking and repeated venues|
|`EventSeries`|Handles clubs, lessons and blocks|
|`Template`|Makes event creation fast and consistent|
|`Conflict`|Creates the “organiser” intelligence|
|`Reminder`|Turns stored information into useful action|

---

## Fields to avoid for now

These should not be v0.1 fields unless a real need appears.

|Avoid for v0.1|Reason|
|---|---|
|Full contact database|Too much admin overhead|
|Meal planning|Different product area|
|Chores|Risks turning app into OurHome clone|
|Family chat|Not needed for the core problem|
|Detailed budgeting|Payment notes are enough|
|Live route planning|Rough travel time is enough|
|School portal integration|High complexity, low initial control|
|Medical record storage|Sensitive and unnecessary for MVP|
|Complex permission model|Shared household use can come later|
|Gift inventory|Birthday prep task is enough|

---

# 6. Recommended MVP Data Shape

A compact event should look broadly like this:

```json
{
  "id": "event_example",
  "title": "Seb birthday party",
  "category": "birthday_party",
  "status": "confirmed",
  "startAt": "2026-06-27T10:30:00+01:00",
  "endAt": "2026-06-27T12:30:00+01:00",
  "placeId": "place_party_venue",
  "participants": ["member_seb"],
  "responsibleAdults": ["member_beck"],
  "resourceNeeds": [
    {
      "resourceId": "resource_family_car",
      "needStatus": "required",
      "neededFrom": "2026-06-27T10:00:00+01:00",
      "neededUntil": "2026-06-27T13:00:00+01:00",
      "allocatedTo": "member_beck"
    }
  ],
  "prepTasks": [
    {
      "title": "RSVP",
      "owner": "member_beck",
      "dueAt": "2026-06-20T18:00:00+01:00",
      "priority": "critical",
      "status": "done",
      "blocksEvent": true
    },
    {
      "title": "Buy present",
      "owner": "member_beck",
      "dueAt": "2026-06-26T18:00:00+01:00",
      "priority": "critical",
      "status": "open",
      "blocksEvent": true
    },
    {
      "title": "Write card",
      "owner": "member_phil",
      "dueAt": "2026-06-26T20:00:00+01:00",
      "priority": "important",
      "status": "open",
      "blocksEvent": false
    }
  ],
  "reminders": [
    {
      "audience": ["member_phil", "member_beck"],
      "trigger": "one_day_before",
      "reason": "Present and card needed"
    }
  ],
  "notes": "Check whether drop-off or stay-and-watch."
}
```

This is rich enough to be useful, but not bloated.

---

# 7. Recommended Product Boundary After Testing

The v0.1 product should be defined as:

> A family logistics organiser that combines calendar events, people, car/resource planning, responsibility, preparation tasks, recurring routines, templates and conflict detection.

The first version should not try to solve everything. It should focus on the real family coordination gaps:

- Car usage
    
- Kit and preparation
    
- Responsibility
    
- Recurring clubs and blocks
    
- Sporadic appointments
    
- Practical weekly visibility
    

That gives the app a clear reason to exist beyond Cozi, OurHome or FamilyWall.
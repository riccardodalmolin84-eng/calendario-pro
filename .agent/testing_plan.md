# Implementation Plan - Final Polish & Comprehensive Testing

The objective is to refine the event modification logic, update UI labels, and perform a deep-dive testing of the entire application flow simulating a mobile device experience.

## User Requirements
- [x] Allow modification of events if all associated bookings are in the past.
- [ ] Rename "Luogo / Sede" to "Indirizzo" in the event modal.
- [ ] Perform comprehensive mobile layout and flow testing:
    - Event Creation & Availability.
    - Online Booking (Manual Simulation).
    - Phone Booking (from both Events and Bookings pages).
    - Modification of past vs future events.

## Proposed Changes

### 1. UI Label Update
- **File**: `src/pages/admin/Events.jsx`
- **Action**: Change the text label from `Luogo / Sede` to `Indirizzo`.

### 2. Logic Verification
- **File**: `src/pages/admin/Events.jsx`
- **Action**: Verify `handleSave` uses `gt('start_time', now)` for the booking check (already implemented, will confirm during testing).

### 3. Automated Mobile Testing Protocol
I will use the browser subagent to perform the following steps in a mobile viewport:
1. **Creation**: Create a "Test Therapy" event, 45 min duration, at "Via Roma 123" (Indirizzo).
2. **Availability**: Set active hours for the current day.
3. **Manual Booking (Events Page)**: Open the manual booking tool directly on the event card and book a slot.
4. **Manual Booking (Bookings Page)**: Navigate to Bookings, use "Nuova Prenotazione", select the event, and book another slot.
5. **Modification (Future)**: Try to edit the "Test Therapy" event. it should be blocked since it has future bookings.
6. **Modification (Past/Empty)**: Create a temporary event with no bookings or mock a past booking, verify it can be edited freely.
7. **Visual Check**: Inspect all modals (Event Edit, Manual Booking) for horizontal overflows or cut-off icons on mobile view.

## Verification Plan
- **Automated Tests**: I will run a browser session to walk through these exact steps.
- **Visual Verification**: I will take screenshots of the mobile layout to ensure the "Indirizzo" field and modals look perfect.
- **Git Push**: All confirmed fixes will be pushed to the repository.

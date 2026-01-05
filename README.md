# Mynder

A lightweight journaling app that helps you capture daily thoughts, manage tasks, and organize events.

## Features

- **Daily Journal Entries**: Write multiple journal entries per day with timestamps
- **Task Management**: Create and manage task checklists and to-do lists
- **Event Calendar**: Schedule and track upcoming events with date/time
- **Smart Notifications**: 
  - Reminds you if you haven't journaled today
  - Alerts you about upcoming events (within 1 hour)
- **Local Storage**: All your data is stored locally in your browser for privacy and offline access

## How to Use

### Getting Started

1. Open `index.html` in your web browser
2. The app will request notification permissions (optional, but recommended for reminders)

### Journal

1. Navigate to the **Journal** tab
2. Write your thoughts in the text area
3. Optionally add a title for your entry
4. Click "Add Entry" to save
5. View all your entries below, organized by date and time
6. Delete entries you no longer need

### Tasks

1. Navigate to the **Tasks** tab
2. Type your task in the input field
3. Press Enter or click "Add Task"
4. Check off tasks as you complete them
5. Delete tasks when no longer needed

### Calendar

1. Navigate to the **Calendar** tab
2. Enter an event title
3. Select a date and time
4. Optionally add a description
5. Click "Add Event" to schedule
6. Events are sorted chronologically
7. Past events are marked with lower opacity

### Notifications

The app automatically checks:
- **Journal Reminders**: Shows a notification if you haven't journaled today
- **Event Reminders**: Alerts you about events happening within the next hour

Reminders check every 30 minutes while the app is open.

## Technical Details

- **No dependencies**: Pure HTML, CSS, and JavaScript
- **Responsive design**: Works on desktop and mobile devices
- **Data persistence**: Uses browser's localStorage API
- **Lightweight**: Total size under 20KB

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- localStorage API
- Notification API (optional, for enhanced notifications)

## Privacy

All data is stored locally in your browser. No data is sent to external servers. Your journal entries, tasks, and events remain private on your device.

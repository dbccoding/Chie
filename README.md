# Mynder

A secure, lightweight journaling app that helps you capture daily thoughts, manage tasks, and organize events with military-grade encryption.

## Features

- **Progressive Web App**: Install on desktop or mobile devices for native app experience
- **Offline Support**: Full functionality works offline via service worker caching
- **Mini Calendar Widget**: Compact monthly calendar at the top of the page showing days with journal entries (green dots) and scheduled events (purple dots)
- **Daily Journal Entries**: Write multiple journal entries per day with timestamps
- **Task Management**: Create and manage task checklists and to-do lists
- **Event Calendar**: Schedule and track upcoming events with date/time
- **Smart Notifications**: 
  - Reminds you if you haven't journaled today
  - Alerts you 1 hour before events
  - Notifies when events start (within 2-minute window)
  - Browser notifications if permission granted
  - Checks every minute for accurate timing
- **Password Protection**: Lock and unlock the app with a password
- **AES-GCM Encryption**: All data encrypted with 256-bit keys before storage
- **Secure Database**: Uses Dexie (IndexedDB) for larger storage capacity and better performance

## How to Use

### Getting Started

1. Open `index.html` in your web browser
2. On first launch, create a password (minimum 6 characters)
   - WARNING: Password cannot be recovered. If forgotten, all data is permanently inaccessible
   - Store your password securely
3. The app will automatically migrate any existing localStorage data and encrypt it
4. The app will request notification permissions (optional, but recommended for event reminders)

### Installing as PWA

The app can be installed as a Progressive Web App:

**Desktop (Chrome/Edge):**
1. Click the "Install" button in the header (when available)
2. Or click the install icon in the address bar
3. App will be installed and accessible from your applications menu

**Mobile (Android/iOS):**
1. Open in browser (Chrome/Safari)
2. Tap "Add to Home Screen" from browser menu
3. App will appear on your home screen like a native app

**PWA Benefits:**
- Works completely offline (all data local and encrypted)
- Native app-like experience
- No app store required
- Automatic updates when online
- Smaller than traditional apps

### Locking and Unlocking

- Click the lock button in the header to manually lock the app
- When locked, all data is cleared from memory and the encryption key is destroyed
- Enter your password to unlock and access your data again

### Mini Calendar

- Located at the top of the page below the header
- Shows current month with navigation arrows to browse other months
- Green dots indicate days with journal entries
- Purple dots indicate days with scheduled events
- Current day is highlighted in purple

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
- **Journal Reminders**: Shows a notification if you haven't journaled today (checks every 30 minutes)
- **Event Reminders**: 
  - Alerts you 1 hour before events (once per event)
  - Notifies when event time is reached (within 2-minute window)
  - Checks every minute for accurate timing
  - Shows both in-app notifications and browser notifications (if permission granted)

## Security

### Encryption

- **AES-GCM 256-bit encryption**: Military-grade encryption for all stored data
- **PBKDF2 key derivation**: Password is hashed with 100,000 iterations
- **Unique IVs**: Each encrypted item uses a unique initialization vector
- **No plain text storage**: All journals, tasks, and events are encrypted before being saved

### Password System

- Password is required to access the app
- Encryption key derived from your password
- Password hash stored separately for verification
- Encryption key exists only in memory while app is unlocked
- When locked, encryption key is completely wiped from memory

### Data Storage

- Uses Dexie (IndexedDB wrapper) for encrypted data storage
- Much larger storage capacity than localStorage (typically 50MB+)
- Better performance for large datasets
- All data remains local to your device

### Important Security Notes

- Password is NOT recoverable - if you forget it, your data is permanently lost
- Write down your password and store it securely
- No backdoor or master key exists
- Data cannot be accessed without the correct password
- Encryption key is never stored on disk

## Technical Details

- **Dependencies**: Dexie v3.2.4 (loaded via CDN)
- **PWA**: Service Worker with offline caching support
- **Manifest**: Web App Manifest for installability
- **Encryption**: Web Crypto API (built into modern browsers)
- **Responsive design**: Works on desktop and mobile devices
- **Data persistence**: IndexedDB with AES-GCM encryption
- **Storage capacity**: 50MB+ (browser dependent)
- **Offline**: Fully functional without internet connection

## Service Worker Capabilities

The service worker provides:

**Caching Strategy:**
- Cache-first for app shell (HTML, CSS, JS, Dexie library)
- Network-first with cache fallback for dynamic content
- Automatic cache updates on new versions

**Offline Support:**
- All app files cached for offline access
- Database operations work without internet
- Encrypted data remains accessible offline

**Future Enhancements (placeholders included):**
- Background sync for cloud backup
- Push notifications for event reminders
- Periodic background sync for data management

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- Web Crypto API (for encryption)
- IndexedDB API
- Service Workers (for PWA/offline support)
- Web App Manifest (for installation)
- Notification API (optional, for enhanced notifications)

Tested on:
- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

Note: PWA installation experience varies by browser and platform.

## Privacy

All data is stored locally in your browser with AES-256 encryption. No data is sent to external servers. Your journal entries, tasks, and events remain completely private on your device. Even if someone gains access to your device's storage, the data is encrypted and cannot be read without your password.

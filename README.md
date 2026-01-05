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

**First Time Setup:**

1. Open `index.html` in your web browser
2. Click "Get Started" on the welcome screen
3. **Step 1 - Create Password**: Choose a strong password (minimum 6 characters)
4. **Step 2 - Save Recovery Key**: A unique recovery key will be generated
   - CRITICAL: Copy or download this key and store it securely
   - This is your only backup if you forget your password
   - Write it down, save in password manager, or print it
5. **Step 3 - Verify Recovery Key**: Enter the recovery key to confirm you saved it
6. Setup complete - your journal is now secured with encryption

**Recovery Key Important Notes:**
- The recovery key is a 12-word phrase (e.g., "alpha-bravo-charlie-delta...")
- Store it separately from your password
- Anyone with this key can access your data
- Keep it as secure as your password
- You cannot change it after setup

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
- **Forgot Password?** Click "Use recovery key" and enter your 12-word recovery key

### If You Forget Your Password

Don't panic! You have a recovery option:

1. On the unlock screen, click "Forgot password? Use recovery key"
2. Enter your 12-word recovery key
3. You'll regain full access to your encrypted data
4. Consider setting a new password you'll remember better

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
- **Master key architecture**: A random master key encrypts your data, which is itself encrypted with both your password and recovery key
- **Unique IVs**: Each encrypted item uses a unique initialization vector
- **No plain text storage**: All journals, tasks, and events are encrypted before being saved

### Password System

- Password required to access the app
- Master encryption key derived from your password
- Password hash stored separately for verification
- Encryption key exists only in memory while app is unlocked
- When locked, encryption key is completely wiped from memory

### Recovery Key System

- 12-word recovery phrase generated during setup
- Provides emergency access if password is forgotten
- Master key is encrypted with both password AND recovery key
- Recovery key uses same encryption strength as password
- Must be stored securely by user

**Recovery Key Best Practices:**
- Write it down on paper and store in a safe place
- Save in a password manager
- Never share it with anyone
- Don't store it in the same place as your password
- Consider printing multiple copies for redundancy

### Data Storage

- Uses Dexie (IndexedDB wrapper) for encrypted data storage
- Much larger storage capacity than localStorage (typically 50MB+)
- Better performance for large datasets
- All data remains local to your device

### Important Security Notes

- Password is NOT stored anywhere - only a hash for verification
- Recovery key provides secure backup access
- Your data can be recovered with EITHER password OR recovery key
- Both must be kept secure - anyone with either can access your data
- Master encryption key is never stored unencrypted
- Encryption key is never stored on disk
- All cryptographic operations use Web Crypto API (browser's built-in security)

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

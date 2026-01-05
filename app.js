// ===== Database & Encryption Setup =====

// Initialize Dexie database
const db = new Dexie('MynderDB');
db.version(1).stores({
    journals: '++id, date, title',
    tasks: '++id, createdAt, completed',
    events: '++id, dateTime, title',
    settings: 'key'
});

// Encryption key (stored in memory only)
let encryptionKey = null;

// Derive encryption key from password using PBKDF2
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Encrypt data
async function encryptData(data) {
    if (!encryptionKey) throw new Error('No encryption key');
    
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        encryptionKey,
        encoder.encode(dataString)
    );
    
    // Combine iv and encrypted data
    return {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
    };
}

// Decrypt data
async function decryptData(encryptedObj) {
    if (!encryptionKey) throw new Error('No encryption key');
    
    const iv = new Uint8Array(encryptedObj.iv);
    const data = new Uint8Array(encryptedObj.data);
    
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            encryptionKey,
            data
        );
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    } catch (e) {
        throw new Error('Decryption failed - wrong password?');
    }
}

// Check if password is already set
async function isPasswordSet() {
    const setting = await db.settings.get('passwordHash');
    return !!setting;
}

// Set up new password
async function setupPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    encryptionKey = await deriveKey(password, salt);
    
    // Hash password for verification (separate from encryption key)
    const passwordHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password)
    );
    
    await db.settings.put({
        key: 'passwordHash',
        value: Array.from(new Uint8Array(passwordHash)),
        salt: Array.from(salt)
    });
    
    // Migrate existing localStorage data if any
    await migrateFromLocalStorage();
    
    return true;
}

// Verify and unlock with password
async function unlockWithPassword(password) {
    const setting = await db.settings.get('passwordHash');
    if (!setting) return false;
    
    const passwordHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password)
    );
    
    const hashArray = Array.from(new Uint8Array(passwordHash));
    const storedHash = setting.value;
    
    // Compare hashes
    if (hashArray.length !== storedHash.length) return false;
    for (let i = 0; i < hashArray.length; i++) {
        if (hashArray[i] !== storedHash[i]) return false;
    }
    
    // Derive encryption key
    const salt = new Uint8Array(setting.salt);
    encryptionKey = await deriveKey(password, salt);
    
    return true;
}

// Migrate data from localStorage to Dexie (one-time migration)
async function migrateFromLocalStorage() {
    const oldJournals = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const oldTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const oldEvents = JSON.parse(localStorage.getItem('events') || '[]');
    
    if (oldJournals.length > 0) {
        for (const journal of oldJournals) {
            const encrypted = await encryptData(journal);
            await db.journals.add(encrypted);
        }
        localStorage.removeItem('journalEntries');
    }
    
    if (oldTasks.length > 0) {
        for (const task of oldTasks) {
            const encrypted = await encryptData(task);
            await db.tasks.add(encrypted);
        }
        localStorage.removeItem('tasks');
    }
    
    if (oldEvents.length > 0) {
        for (const event of oldEvents) {
            const encrypted = await encryptData(event);
            await db.events.add(encrypted);
        }
        localStorage.removeItem('events');
    }
}

// Lock the app
function lockApp() {
    encryptionKey = null;
    document.querySelector('.container').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    
    // Clear in-memory data
    journalEntries = [];
    tasks = [];
    events = [];
}

// Unlock UI handlers
document.getElementById('setup-btn').addEventListener('click', async () => {
    const password = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (!password || password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    if (password !== confirm) {
        alert('Passwords do not match');
        return;
    }
    
    await setupPassword(password);
    document.getElementById('lock-screen').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
    initApp();
});

document.getElementById('unlock-btn').addEventListener('click', async () => {
    const password = document.getElementById('unlock-password-input').value;
    const errorEl = document.getElementById('unlock-error');
    
    if (!password) {
        errorEl.textContent = 'Please enter your password';
        return;
    }
    
    const success = await unlockWithPassword(password);
    
    if (success) {
        errorEl.textContent = '';
        document.getElementById('lock-screen').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        await initApp();
    } else {
        errorEl.textContent = 'Incorrect password. Please try again.';
        document.getElementById('unlock-password-input').value = '';
    }
});

document.getElementById('unlock-password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('unlock-btn').click();
    }
});

document.getElementById('lock-app-btn').addEventListener('click', () => {
    if (confirm('Lock the app? You\'ll need your password to unlock it.')) {
        lockApp();
    }
});

// Check password setup on load
async function checkPasswordSetup() {
    const hasPassword = await isPasswordSet();
    
    if (hasPassword) {
        document.getElementById('setup-password').style.display = 'none';
        document.getElementById('unlock-password').style.display = 'block';
    } else {
        document.getElementById('setup-password').style.display = 'block';
        document.getElementById('unlock-password').style.display = 'none';
    }
}

// Initialize data from localStorage (legacy - will be migrated)
let journalEntries = [];
let tasks = [];
let events = [];
let lastJournalDate = localStorage.getItem('lastJournalDate') || '';

// Calendar state
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// Mini Calendar functionality
function renderMiniCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update month/year display
    document.getElementById('current-month-year').textContent = 
        `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = currentCalendarMonth === today.getMonth() && 
                          currentCalendarYear === today.getFullYear();
    const todayDate = today.getDate();
    
    // Get dates with journal entries and events
    const journalDates = new Set(journalEntries.map(entry => {
        const date = new Date(entry.date);
        if (date.getMonth() === currentCalendarMonth && date.getFullYear() === currentCalendarYear) {
            return date.getDate();
        }
        return null;
    }).filter(d => d !== null));
    
    const eventDates = new Set(events.map(event => {
        const date = new Date(event.dateTime);
        if (date.getMonth() === currentCalendarMonth && date.getFullYear() === currentCalendarYear) {
            return date.getDate();
        }
        return null;
    }).filter(d => d !== null));
    
    // Add previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = day;
        grid.appendChild(dayEl);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        // Mark today
        if (isCurrentMonth && day === todayDate) {
            dayEl.classList.add('today');
        }
        
        // Mark days with journals
        if (journalDates.has(day)) {
            dayEl.classList.add('has-journal');
        }
        
        // Mark days with events
        if (eventDates.has(day)) {
            dayEl.classList.add('has-events');
        }
        
        grid.appendChild(dayEl);
    }
    
    // Add next month's days to fill the grid
    const totalCells = grid.children.length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        dayEl.textContent = day;
        grid.appendChild(dayEl);
    }
}

// Calendar navigation
document.getElementById('prev-month').addEventListener('click', () => {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    renderMiniCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderMiniCalendar();
});

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Journal functionality
document.getElementById('add-journal-btn').addEventListener('click', addJournalEntry);

async function addJournalEntry() {
    const title = document.getElementById('journal-title').value.trim();
    const content = document.getElementById('journal-entry').value.trim();
    
    if (!content) {
        alert('Please write something in your journal entry!');
        return;
    }
    
    const entry = {
        id: Date.now(),
        title: title || 'Untitled Entry',
        content: content,
        date: new Date().toISOString()
    };
    
    // Encrypt and store in Dexie
    const encrypted = await encryptData(entry);
    await db.journals.add(encrypted);
    
    // Update last journal date
    const today = new Date().toDateString();
    localStorage.setItem('lastJournalDate', today);
    lastJournalDate = today;
    
    // Clear inputs
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-entry').value = '';
    
    await renderJournalEntries();
    renderMiniCalendar(); // Update calendar when journal entry is added
}

async function renderJournalEntries() {
    const container = document.getElementById('journal-entries');
    
    // Get all encrypted entries from Dexie
    const encryptedEntries = await db.journals.toArray();
    
    if (encryptedEntries.length === 0) {
        container.innerHTML = '<div class=\"empty-state\">No journal entries yet. Start writing!</div>';
        journalEntries = [];
        return;
    }
    
    // Decrypt all entries
    journalEntries = [];
    for (const encrypted of encryptedEntries) {
        try {
            const decrypted = await decryptData(encrypted);
            journalEntries.push(decrypted);
        } catch (e) {
            console.error('Failed to decrypt entry:', e);
        }
    }
    
    // Sort by date (newest first)
    journalEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = journalEntries.map(entry => {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="journal-entry-item">
                <button class="delete-btn" onclick="deleteJournalEntry(${entry.id})">Delete</button>
                <h3>${entry.title}</h3>
                <div class="entry-date">${formattedDate}</div>
                <div class="entry-content">${entry.content}</div>
            </div>
        `;
    }).join('');
}

async function deleteJournalEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        // Find and delete encrypted entry
        const encryptedEntries = await db.journals.toArray();
        for (const encrypted of encryptedEntries) {
            const decrypted = await decryptData(encrypted);
            if (decrypted.id === id) {
                await db.journals.delete(encrypted.id);
                break;
            }
        }
        
        await renderJournalEntries();
        renderMiniCalendar(); // Update calendar when journal entry is deleted
    }
}

// Task functionality
document.getElementById('add-task-btn').addEventListener('click', addTask);

document.getElementById('task-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

async function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    
    if (!text) {
        alert('Please enter a task!');
        return;
    }
    
    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    const encrypted = await encryptData(task);
    await db.tasks.add(encrypted);
    
    input.value = '';
    await renderTasks();
}

async function renderTasks() {
    const container = document.getElementById('task-list');
    
    const encryptedTasks = await db.tasks.toArray();
    
    if (encryptedTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No tasks yet. Add your first task!</div>';
        tasks = [];
        return;
    }
    
    // Decrypt all tasks
    tasks = [];
    for (const encrypted of encryptedTasks) {
        try {
            const decrypted = await decryptData(encrypted);
            tasks.push(decrypted);
        } catch (e) {
            console.error('Failed to decrypt task:', e);
        }
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <span class="task-text">${task.text}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `).join('');
}

async function toggleTask(id) {
    const encryptedTasks = await db.tasks.toArray();
    
    for (const encrypted of encryptedTasks) {
        const decrypted = await decryptData(encrypted);
        if (decrypted.id === id) {
            decrypted.completed = !decrypted.completed;
            const newEncrypted = await encryptData(decrypted);
            await db.tasks.update(encrypted.id, newEncrypted);
            break;
        }
    }
    
    await renderTasks();
}

async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        const encryptedTasks = await db.tasks.toArray();
        for (const encrypted of encryptedTasks) {
            const decrypted = await decryptData(encrypted);
            if (decrypted.id === id) {
                await db.tasks.delete(encrypted.id);
                break;
            }
        }
        await renderTasks();
    }
}

// Event/Calendar functionality
document.getElementById('add-event-btn').addEventListener('click', addEvent);

async function addEvent() {
    const title = document.getElementById('event-title').value.trim();
    const dateTime = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value.trim();
    
    if (!title) {
        alert('Please enter an event title!');
        return;
    }
    
    if (!dateTime) {
        alert('Please select a date and time for the event!');
        return;
    }
    
    const event = {
        id: Date.now(),
        title: title,
        dateTime: dateTime,
        description: description,
        createdAt: new Date().toISOString()
    };
    
    const encrypted = await encryptData(event);
    await db.events.add(encrypted);
    
    // Clear inputs
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-description').value = '';
    
    await renderEvents();
    renderMiniCalendar(); // Update calendar when event is added
}

async function renderEvents() {
    const container = document.getElementById('events-list');
    
    const encryptedEvents = await db.events.toArray();
    
    if (encryptedEvents.length === 0) {
        container.innerHTML = '<div class="empty-state">No events scheduled. Add your first event!</div>';
        events = [];
        return;
    }
    
    // Decrypt all events
    events = [];
    for (const encrypted of encryptedEvents) {
        try {
            const decrypted = await decryptData(encrypted);
            events.push(decrypted);
        } catch (e) {
            console.error('Failed to decrypt event:', e);
        }
    }
    
    // Sort by date
    events.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    
    const now = new Date();
    
    container.innerHTML = events.map(event => {
        const eventDate = new Date(event.dateTime);
        const isPast = eventDate < now;
        const formattedDate = eventDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="event-item" style="${isPast ? 'opacity: 0.6;' : ''}">
                <button class="delete-btn" onclick="deleteEvent(${event.id})">Delete</button>
                <h3>${event.title}</h3>
                <div class="event-date">${formattedDate} ${isPast ? '(Past)' : ''}</div>
                ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            </div>
        `;
    }).join('');
}

async function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        const encryptedEvents = await db.events.toArray();
        for (const encrypted of encryptedEvents) {
            const decrypted = await decryptData(encrypted);
            if (decrypted.id === id) {
                await db.events.delete(encrypted.id);
                break;
            }
        }
        
        // Clear notification flags for this event
        localStorage.removeItem(`notified_${id}`);
        localStorage.removeItem(`event_notified_${id}`);
        
        await renderEvents();
        renderMiniCalendar(); // Update calendar when event is deleted
    }
}

// Notification system
function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <h4>${title}</h4>
        <p>${message}</p>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function checkJournalReminder() {
    const today = new Date().toDateString();
    
    // Check if user hasn't journaled today
    if (lastJournalDate !== today) {
        const lastDate = lastJournalDate ? new Date(lastJournalDate) : null;
        const daysSinceLastEntry = lastDate ? 
            Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24)) : null;
        
        if (daysSinceLastEntry === null) {
            showNotification('Welcome to Mynder!', 'Start your journaling journey today!');
        } else if (daysSinceLastEntry > 0) {
            showNotification('Journal Reminder', 
                `You haven't journaled today. It's been ${daysSinceLastEntry} day${daysSinceLastEntry > 1 ? 's' : ''} since your last entry!`);
        }
    }
}

function checkEventReminders() {
    const now = new Date();
    const upcomingWindow = 60 * 60 * 1000; // 1 hour in milliseconds
    const eventTimeWindow = 2 * 60 * 1000; // 2 minutes - window to catch the actual event time
    
    events.forEach(event => {
        const eventDate = new Date(event.dateTime);
        const timeUntilEvent = eventDate - now;
        const lastNotified = localStorage.getItem(`notified_${event.id}`);
        
        // Check if event is happening now (within 2 minute window)
        if (Math.abs(timeUntilEvent) <= eventTimeWindow) {
            const eventNotified = localStorage.getItem(`event_notified_${event.id}`);
            if (!eventNotified) {
                showNotification('Event Starting Now! 🎯', 
                    `"${event.title}" is starting now!`);
                localStorage.setItem(`event_notified_${event.id}`, now.toISOString());
                
                // Also try browser notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Event Starting Now!', {
                        body: `"${event.title}" is starting now!`,
                        icon: '🎯'
                    });
                }
            }
        }
        // Check if event is within the next hour and hasn't passed
        else if (timeUntilEvent > 0 && timeUntilEvent <= upcomingWindow) {
            const minutesUntil = Math.floor(timeUntilEvent / (1000 * 60));
            
            // Only notify if we haven't notified for this event recently (once per 30 min)
            if (!lastNotified || (now - new Date(lastNotified)) > 30 * 60 * 1000) {
                showNotification('Upcoming Event ⏰', 
                    `"${event.title}" is in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}!`);
                localStorage.setItem(`notified_${event.id}`, now.toISOString());
                
                // Also try browser notification if permission granted
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Upcoming Event', {
                        body: `"${event.title}" is in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}!`,
                        icon: '⏰'
                    });
                }
            }
        }
    });
}

// Request notification permissions
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Initialize app
async function initApp() {
    renderMiniCalendar(); // Render calendar first
    await renderJournalEntries();
    await renderTasks();
    await renderEvents();
    
    // Check for reminders on load
    setTimeout(() => {
        checkJournalReminder();
        checkEventReminders();
    }, 1000);
    
    // Check event reminders more frequently (every minute) to catch event times
    setInterval(() => {
        checkEventReminders();
    }, 60 * 1000);
    
    // Check journal reminders less frequently (every 30 minutes)
    setInterval(() => {
        checkJournalReminder();
    }, 30 * 60 * 1000);
    
    // Request notification permission
    requestNotificationPermission();
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPasswordSetup);
} else {
    checkPasswordSetup();
}

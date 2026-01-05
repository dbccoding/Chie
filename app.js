// Initialize data from localStorage
let journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let events = JSON.parse(localStorage.getItem('events')) || [];
let lastJournalDate = localStorage.getItem('lastJournalDate') || '';

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

function addJournalEntry() {
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
    
    journalEntries.unshift(entry);
    localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
    
    // Update last journal date
    const today = new Date().toDateString();
    localStorage.setItem('lastJournalDate', today);
    lastJournalDate = today;
    
    // Clear inputs
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-entry').value = '';
    
    renderJournalEntries();
}

function renderJournalEntries() {
    const container = document.getElementById('journal-entries');
    
    if (journalEntries.length === 0) {
        container.innerHTML = '<div class="empty-state">No journal entries yet. Start writing!</div>';
        return;
    }
    
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

function deleteJournalEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        journalEntries = journalEntries.filter(entry => entry.id !== id);
        localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
        renderJournalEntries();
    }
}

// Task functionality
document.getElementById('add-task-btn').addEventListener('click', addTask);

document.getElementById('task-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

function addTask() {
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
    
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    input.value = '';
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('task-list');
    
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state">No tasks yet. Add your first task!</div>';
        return;
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

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }
}

// Event/Calendar functionality
document.getElementById('add-event-btn').addEventListener('click', addEvent);

function addEvent() {
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
    
    events.push(event);
    events.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    localStorage.setItem('events', JSON.stringify(events));
    
    // Clear inputs
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-description').value = '';
    
    renderEvents();
}

function renderEvents() {
    const container = document.getElementById('events-list');
    
    if (events.length === 0) {
        container.innerHTML = '<div class="empty-state">No events scheduled. Add your first event!</div>';
        return;
    }
    
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

function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        events = events.filter(event => event.id !== id);
        localStorage.setItem('events', JSON.stringify(events));
        renderEvents();
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
    
    events.forEach(event => {
        const eventDate = new Date(event.dateTime);
        const timeUntilEvent = eventDate - now;
        
        // Check if event is within the next hour and hasn't passed
        if (timeUntilEvent > 0 && timeUntilEvent <= upcomingWindow) {
            const minutesUntil = Math.floor(timeUntilEvent / (1000 * 60));
            const lastNotified = localStorage.getItem(`notified_${event.id}`);
            
            // Only notify if we haven't notified for this event recently
            if (!lastNotified || (now - new Date(lastNotified)) > 10 * 60 * 1000) {
                showNotification('Upcoming Event', 
                    `"${event.title}" is in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}!`);
                localStorage.setItem(`notified_${event.id}`, now.toISOString());
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
function initApp() {
    renderJournalEntries();
    renderTasks();
    renderEvents();
    
    // Check for reminders on load
    setTimeout(() => {
        checkJournalReminder();
        checkEventReminders();
    }, 1000);
    
    // Check reminders periodically (every 30 minutes)
    setInterval(() => {
        checkJournalReminder();
        checkEventReminders();
    }, 30 * 60 * 1000);
    
    // Request notification permission
    requestNotificationPermission();
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

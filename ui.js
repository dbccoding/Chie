// ===== UI & Event Handlers Module =====

// ===== Supportive Messaging System =====

const supportiveMessages = {
    longEntry: [
        "You've had a lot to think about today. Let's get that stored away for you.",
        "That's quite a reflection. I'm glad you took the time to write it all out.",
        "You've given this some real thought. Your words are safe here now.",
        "Sometimes we need to get everything out. Thanks for trusting me with this.",
        "A lot on your mind today. I'm here whenever you need to process things."
    ],
    shortEntry: [
        "Thanks for checking in today, let's talk more soon.",
        "Good to hear from you. I'm here whenever you need me.",
        "Short and sweet. Every check-in counts.",
        "Quick note saved. I'm always here when you want to share more.",
        "Thanks for stopping by. See you next time."
    ],
    returnAfterGap: [
        "You've not been around much lately. Let me know if you need to talk.",
        "Welcome back. I've missed our conversations.",
        "It's been a while. I'm here if you want to catch up.",
        "Good to see you again. No pressure, just write what feels right.",
        "You're back. I'm ready to listen whenever you are."
    ],
    firstEntry: [
        "Welcome to your journal. This is a safe space just for you.",
        "Your first entry. Here's to many more conversations.",
        "Thanks for starting this journey with me. I'm here for you.",
        "Your thoughts are safe here. Looking forward to being part of your story."
    ],
    lateNight: [
        "Can't sleep? Any time is a good time to write down your thoughts.",
        "Late night reflections can be the most honest. I'm here for it.",
        "The quiet hours. Sometimes that's when we think most clearly.",
        "Up late? Let's work through whatever's on your mind.",
        "Night thoughts saved. Hope this helps you rest easier."
    ],
    earlyMorning: [
        "I see you're keen to get started! I hope you made coffee.",
        "Early bird. What's got you up and writing already?",
        "Starting before the world wakes up. That's dedication.",
        "You're up early. Let's make the most of this quiet time.",
        "Morning thoughts captured. Hope the rest of your day is great."
    ],
    morning: [
        "Good morning. A great way to start the day.",
        "Morning pages done. Ready to take on whatever comes next?",
        "Starting the day by checking in with yourself. That's healthy.",
        "Morning clarity captured. Have a good one.",
        "Nice way to ease into the day. Thanks for sharing."
    ],
    evening: [
        "End of day reflections. A good way to wind down.",
        "Evening check-in. How did today go?",
        "Nice to decompress before the day ends.",
        "Evening thoughts saved. Hope you have a restful night.",
        "Good time to reflect on the day. Thanks for sharing."
    ],
    frequentUser: [
        "Your mind is busy today! Let's get it all out.",
        "Back again. I'm here for as many conversations as you need.",
        "Third time today? I'm not going anywhere. Keep talking.",
        "Lots to process today. Take your time, I'll be here.",
        "Another check-in. Good to see you working through things."
    ]
};

// ===== PAD Emotion Analysis System =====

const emotionKeywords = {
    pleasure: {
        positive: {
            strong: ['love', 'wonderful', 'amazing', 'incredible', 'blessed', 'grateful', 'fantastic', 'excellent', 'perfect', 'joy', 'delighted', 'thrilled'],
            moderate: ['happy', 'good', 'great', 'nice', 'better', 'hopeful', 'glad', 'pleased', 'satisfied', 'content', 'positive'],
            mild: ['okay', 'fine', 'alright', 'decent', 'acceptable']
        },
        negative: {
            strong: ['terrible', 'horrible', 'devastating', 'miserable', 'hate', 'despair', 'awful', 'dreadful', 'nightmare', 'catastrophic'],
            moderate: ['sad', 'bad', 'difficult', 'hard', 'painful', 'hurt', 'upset', 'unhappy', 'disappointed', 'rough'],
            mild: ['meh', 'bothered', 'annoyed', 'frustrated', 'uncertain']
        }
    },
    arousal: {
        high: ['excited', 'energized', 'anxious', 'stressed', 'angry', 'motivated', 'restless', 'overwhelmed', 'passionate', 'intense', 'hyper', 'nervous', 'frantic', 'worked up'],
        low: ['calm', 'tired', 'exhausted', 'peaceful', 'depressed', 'relaxed', 'drained', 'serene', 'lethargic', 'sleepy', 'quiet', 'still', 'mellow']
    },
    dominance: {
        high: ['confident', 'capable', 'powerful', 'strong', 'determined', 'accomplished', 'assertive', 'prepared', 'ready', 'empowered', 'in control', 'sure'],
        low: ['helpless', 'overwhelmed', 'trapped', 'lost', 'confused', 'uncertain', 'powerless', 'vulnerable', 'stuck', 'defeated', 'weak', 'insecure']
    }
};

const coachMessages = {
    excitedJoyful: [
        "Your energy is contagious right now! Let's capture this feeling so you can revisit it later.",
        "You're radiating positivity. What's contributing to this uplift?",
        "This is a great headspace. Consider what you want to achieve while you're feeling this energized.",
        "I can feel the excitement in your words. This momentum is powerful.",
        "You're on fire today! Let's make the most of this energy."
    ],
    calmContent: [
        "There's a real sense of peace in your words. That's worth acknowledging.",
        "Contentment like this is rare. Take a moment to appreciate where you are.",
        "You sound grounded today. This clarity is valuable.",
        "This calm confidence you're expressing? It suits you.",
        "There's a beautiful stillness in what you've written."
    ],
    anxiousStressed: [
        "I can sense some tension here. Remember, writing it down is the first step to working through it.",
        "This sounds intense. When things feel this way, sometimes breaking it down helps.",
        "Your feelings are valid. Let's get them out so they're not just swirling inside.",
        "I hear the pressure you're under. One thought at a time, we'll work through this.",
        "That sounds heavy. But you're doing the right thing by processing it here."
    ],
    sadDepressed: [
        "It's okay to have days like this. You showed up, and that matters.",
        "Sometimes just acknowledging how we feel is enough for now. I'm here.",
        "Heavy days happen. There's no pressure to feel differently right now.",
        "I see you're struggling. That takes courage to admit.",
        "This won't last forever, even if it feels that way right now."
    ],
    lowControl: [
        "When things feel out of control, small actions can help. You're taking one by writing.",
        "You might not feel it right now, but you're stronger than you think.",
        "One step at a time. That's all anyone can do.",
        "I know it feels like everything's beyond your reach, but you're here. That's something.",
        "Even in uncertainty, you're finding your way forward."
    ],
    highControl: [
        "You sound ready to tackle what's ahead. That determination is powerful.",
        "This confidence you're feeling? Hold onto it. You've got this.",
        "You're in the driver's seat. Keep that momentum going.",
        "The clarity in your words shows real self-assurance. That's impressive.",
        "You're owning this moment. That's the kind of energy that moves mountains."
    ],
    neutral: [
        "Thanks for checking in. Every entry builds a picture of your journey.",
        "I'm here, listening. Whatever you need to share, I'm ready.",
        "Your thoughts are safe here. Take your time."
    ]
};

const welcomeMessages = {
    dailyUser: [
        "Welcome back.",
        "Good to see you again.",
        "Hello. Ready when you are.",
        "Back again. I'm here.",
        "Welcome. Let's begin."
    ],
    regularUser: [
        "Welcome back. How have things been?",
        "Good to see you. What's on your mind?",
        "Hello again. I'm here to listen.",
        "Welcome. Ready to catch up?",
        "Back with me. Let's talk."
    ],
    returningUser: [
        "It's been a few days. Welcome back.",
        "I've been waiting for you. How are you doing?",
        "You're back. I'm here if you need to talk about anything.",
        "Welcome back. No judgment, just space to share.",
        "Good to have you here again. Take your time."
    ],
    longAbsence: [
        "It's been a while. I hope you're doing okay.",
        "Welcome back. A lot can happen in a week. I'm here to listen.",
        "You've been away for some time. I'm here whenever you need me.",
        "Welcome back. There's no pressure, just space for your thoughts.",
        "I've missed you. Ready to reconnect when you are."
    ]
};

function getRandomMessage(category) {
    const messages = supportiveMessages[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

function getRandomWelcomeMessage(category) {
    const messages = welcomeMessages[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

function getWelcomeMessage(daysSinceLastAccess) {
    if (daysSinceLastAccess === 0) {
        return getRandomWelcomeMessage('dailyUser');
    } else if (daysSinceLastAccess === 1) {
        return getRandomWelcomeMessage('regularUser');
    } else if (daysSinceLastAccess >= 2 && daysSinceLastAccess <= 4) {
        return getRandomWelcomeMessage('returningUser');
    } else {
        return getRandomWelcomeMessage('longAbsence');
    }
}

function showWelcomeBanner(message) {
    // Remove any existing welcome banners first
    const existingBanners = document.querySelectorAll('.welcome-banner');
    existingBanners.forEach(b => b.remove());
    
    const banner = document.createElement('div');
    banner.className = 'welcome-banner';
    banner.innerHTML = `
        <div class="welcome-message">${message}</div>
    `;
    
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    header.after(banner);
    
    // Fade in
    setTimeout(() => banner.classList.add('show'), 10);
    
    // Fade out and remove after 5 seconds
    setTimeout(() => {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 500);
    }, 5000);
}

function getSupportiveMessage(entryLength, daysSinceLastEntry, isFirstEntry) {
    if (isFirstEntry) {
        return getRandomMessage('firstEntry');
    }
    
    // Check how many entries today
    const today = new Date().toDateString();
    const entriesToday = journalEntries.filter(entry => 
        new Date(entry.date).toDateString() === today
    ).length;
    
    // Get current hour (0-23)
    const hour = new Date().getHours();
    
    // Time-based messages take priority for context
    if (entriesToday >= 2) {
        return getRandomMessage('frequentUser');
    }
    
    if (hour >= 22 || hour <= 2) {
        return getRandomMessage('lateNight');
    }
    
    if (hour >= 3 && hour <= 5) {
        return getRandomMessage('earlyMorning');
    }
    
    if (hour >= 6 && hour <= 9) {
        return getRandomMessage('morning');
    }
    
    if (hour >= 18 && hour <= 21) {
        return getRandomMessage('evening');
    }
    
    // If no time-specific message, check for return after gap
    if (daysSinceLastEntry >= 3) {
        return getRandomMessage('returnAfterGap');
    }
    
    // Otherwise use length-based messages
    if (entryLength < 200) {
        return getRandomMessage('shortEntry');
    }
    
    if (entryLength > 500) {
        return getRandomMessage('longEntry');
    }
    
    // Default for medium-length entries during the day
    return getRandomMessage('shortEntry');
}

function showSupportiveNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'supportive-notification';
    notification.innerHTML = `
        <div class="supportive-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Fade out and remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function analyzeSentiment(text) {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let pleasureScore = 0;
    let arousalScore = 0;
    let dominanceScore = 0;
    
    // Analyze pleasure dimension
    words.forEach(word => {
        emotionKeywords.pleasure.positive.strong.forEach(kw => {
            if (lowerText.includes(kw)) pleasureScore += 3;
        });
        emotionKeywords.pleasure.positive.moderate.forEach(kw => {
            if (lowerText.includes(kw)) pleasureScore += 2;
        });
        emotionKeywords.pleasure.positive.mild.forEach(kw => {
            if (lowerText.includes(kw)) pleasureScore += 1;
        });
        
        emotionKeywords.pleasure.negative.strong.forEach(kw => {
            if (lowerText.includes(kw)) pleasureScore -= 3;
        });
        emotionKeywords.pleasure.negative.moderate.forEach(kw => {
            if (lowerText.includes(kw)) pleasureScore -= 2;
        });
        emotionKeywords.pleasure.negative.mild.forEach(kw => {
            if (lowerText.includes(kw)) pleasureScore -= 1;
        });
    });
    
    // Analyze arousal dimension
    emotionKeywords.arousal.high.forEach(kw => {
        if (lowerText.includes(kw)) arousalScore += 1;
    });
    emotionKeywords.arousal.low.forEach(kw => {
        if (lowerText.includes(kw)) arousalScore -= 1;
    });
    
    // Analyze dominance dimension
    emotionKeywords.dominance.high.forEach(kw => {
        if (lowerText.includes(kw)) dominanceScore += 1;
    });
    emotionKeywords.dominance.low.forEach(kw => {
        if (lowerText.includes(kw)) dominanceScore -= 1;
    });
    
    // Normalize scores to -1 to 1 range
    const maxScore = words.length * 0.3; // Normalize based on text length
    return {
        pleasure: Math.max(-1, Math.min(1, pleasureScore / Math.max(maxScore, 1))),
        arousal: Math.max(-1, Math.min(1, arousalScore / Math.max(maxScore * 0.5, 1))),
        dominance: Math.max(-1, Math.min(1, dominanceScore / Math.max(maxScore * 0.5, 1)))
    };
}

function getSentimentColor(sentiment) {
    const { pleasure, arousal, dominance } = sentiment;
    
    // High pleasure + high arousal (excited/joyful)
    if (pleasure > 0.3 && arousal > 0.3) {
        return '#fce5a7ff'; // Warmer, more golden
    }
    
    // High pleasure + low arousal (calm/content)
    if (pleasure > 0.3 && arousal < -0.2) {
        return '#f3c8a5ff'; // Softer peach
    }
    
    // Low pleasure + high arousal (anxious/stressed)
    if (pleasure < -0.3 && arousal > 0.3) {
        return '#e1cefcff'; // More noticeable lavender
    }
    
    // Low pleasure + low arousal (sad/depressed)
    if (pleasure < -0.3 && arousal < -0.2) {
        return '#c7e0f7ff'; // Clearer blue-gray
    }
    
    // Neutral/mixed
    return '#e4e4ddff'; // Slightly cooler neutral
}

function getCoachMessage(sentiment) {
    const { pleasure, arousal, dominance } = sentiment;
    
    // Determine emotional state
    if (pleasure > 0.3 && arousal > 0.3) {
        return coachMessages.excitedJoyful[Math.floor(Math.random() * coachMessages.excitedJoyful.length)];
    }
    
    if (pleasure > 0.3 && arousal < -0.2) {
        return coachMessages.calmContent[Math.floor(Math.random() * coachMessages.calmContent.length)];
    }
    
    if (pleasure < -0.3 && arousal > 0.3) {
        return coachMessages.anxiousStressed[Math.floor(Math.random() * coachMessages.anxiousStressed.length)];
    }
    
    if (pleasure < -0.3 && arousal < -0.2) {
        return coachMessages.sadDepressed[Math.floor(Math.random() * coachMessages.sadDepressed.length)];
    }
    
    if (dominance < -0.4) {
        return coachMessages.lowControl[Math.floor(Math.random() * coachMessages.lowControl.length)];
    }
    
    if (dominance > 0.4) {
        return coachMessages.highControl[Math.floor(Math.random() * coachMessages.highControl.length)];
    }
    
    return coachMessages.neutral[Math.floor(Math.random() * coachMessages.neutral.length)];
}

function showCoachBanner(message) {
    const banner = document.createElement('div');
    banner.className = 'coach-banner';
    banner.innerHTML = `
        <div class="coach-message">${message}</div>
    `;
    
    const container = document.querySelector('.container');
    const header = container.querySelector('header');
    header.after(banner);
    
    // Fade in
    setTimeout(() => banner.classList.add('show'), 10);
    
    // Fade out and remove after 6 seconds
    setTimeout(() => {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 500);
    }, 6000);
}

function applyMoodBackground(sentiment) {
    const moodRingEnabled = localStorage.getItem('moodRingEnabled') !== 'false';
    const color = moodRingEnabled ? getSentimentColor(sentiment) : '#ffffff';
    
    // Apply to CSS variable
    document.documentElement.style.setProperty('--mood-bg-color', color);
    
    // Also apply directly to container for immediate effect
    const container = document.querySelector('.container');
    if (container) {
        container.style.backgroundColor = color;
    }
}

function getMostRecentSentiment() {
    if (journalEntries.length === 0) return null;
    const mostRecent = journalEntries[0]; // Already sorted newest first
    return mostRecent.sentiment || null;
}

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

// Calendar navigation functions
function navigateToPrevMonth() {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    renderMiniCalendar();
}

function navigateToNextMonth() {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderMiniCalendar();
}

// ===== Journal UI Functions =====

async function addJournalEntry() {
    const title = document.getElementById('journal-title').value.trim();
    const content = document.getElementById('journal-entry').value.trim();
    
    if (!content) {
        alert('Please write something in your journal entry!');
        return;
    }
    
    // Calculate days since last entry
    const lastEntry = journalEntries.length > 0 ? new Date(journalEntries[0].date) : null;
    const now = new Date();
    const daysSinceLastEntry = lastEntry ? 
        Math.floor((now - lastEntry) / (1000 * 60 * 60 * 24)) : 0;
    const isFirstEntry = journalEntries.length === 0;
    
    // Analyze sentiment
    const sentiment = analyzeSentiment(content);
    
    const entry = {
        id: Date.now(),
        title: title || 'Untitled Entry',
        content: content,
        date: new Date().toISOString(),
        sentiment: sentiment
    };
    
    // Save to database
    await addJournalToDB(entry);
    
    // Update last journal date
    const today = new Date().toDateString();
    localStorage.setItem('lastJournalDate', today);
    lastJournalDate = today;
    
    // Apply mood background
    applyMoodBackground(sentiment);
    
    // Show supportive message first
    const message = getSupportiveMessage(content.length, daysSinceLastEntry, isFirstEntry);
    showSupportiveNotification(message);
    
    // Show coach message after supportive message (if not first entry)
    if (!isFirstEntry) {
        const coachMsg = getCoachMessage(sentiment);
        setTimeout(() => showCoachBanner(coachMsg), 4500);
    }
    
    // Clear inputs
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-entry').value = '';
    
    await renderJournalEntries();
    renderMiniCalendar();
}

async function renderJournalEntries() {
    const container = document.getElementById('journal-entries');
    
    await loadJournalsFromDB();
    
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

async function deleteJournalEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        await deleteJournalFromDB(id);
        await renderJournalEntries();
        renderMiniCalendar();
    }
}

// ===== Task UI Functions =====

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
    
    await addTaskToDB(task);
    input.value = '';
    await renderTasks();
}

async function renderTasks() {
    const container = document.getElementById('task-list');
    
    await loadTasksFromDB();
    
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

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        await updateTaskInDB(id, task);
        await renderTasks();
    }
}

async function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        await deleteTaskFromDB(id);
        await renderTasks();
    }
}

// ===== Event UI Functions =====

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
    
    await addEventToDB(event);
    
    // Clear inputs
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-description').value = '';
    
    await renderEvents();
    renderMiniCalendar();
}

async function renderEvents() {
    const container = document.getElementById('events-list');
    
    await loadEventsFromDB();
    
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

async function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        await deleteEventFromDB(id);
        
        // Clear notification flags for this event
        localStorage.removeItem(`notified_${id}`);
        localStorage.removeItem(`event_notified_${id}`);
        
        await renderEvents();
        renderMiniCalendar();
    }
}

// ===== Notification System =====

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
            showNotification('Welcome to Chie!', 'Start your journaling journey today!');
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

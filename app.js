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
let tempRecoveryKey = null; // Temporary storage during onboarding
let tempPassword = null; // Temporary storage during onboarding

// Generate a random recovery key (24 words/phrases for better UX)
function generateRecoveryKey() {
    const words = [
        'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
        'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
        'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
        'yankee', 'zulu', 'azure', 'bronze', 'copper', 'diamond', 'emerald', 'frost',
        'golden', 'harbor', 'ivory', 'jade', 'knight', 'lunar', 'marble', 'nebula',
        'ocean', 'pearl', 'quartz', 'ruby', 'silver', 'tiger', 'ultra', 'velvet'
    ];
    
    const keyWords = [];
    const randomBytes = crypto.getRandomValues(new Uint8Array(12));
    
    for (let i = 0; i < 12; i++) {
        const index = randomBytes[i] % words.length;
        keyWords.push(words[index]);
    }
    
    return keyWords.join('-');
}

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
    const setting = await db.settings.get('passwordData');
    return !!setting;
}

// Set up new password
async function setupPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const masterKey = crypto.getRandomValues(new Uint8Array(32)); // Generate master key
    
    // Derive key from password
    const passwordKey = await deriveKey(password, salt);
    
    // Encrypt master key with password
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedMasterKey = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        passwordKey,
        masterKey
    );
    
    // Hash password for verification
    const passwordHash = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(password)
    );
    
    await db.settings.put({
        key: 'passwordData',
        passwordHash: Array.from(new Uint8Array(passwordHash)),
        salt: Array.from(salt),
        iv: Array.from(iv),
        encryptedMasterKey: Array.from(new Uint8Array(encryptedMasterKey))
    });
    
    // Import master key for use
    encryptionKey = await crypto.subtle.importKey(
        'raw',
        masterKey,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );
    
    return masterKey; // Return for recovery key encryption
}

// Set up recovery key
async function setupRecoveryKey(recoveryKey, masterKey) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key from recovery key
    const recoveryDerivedKey = await deriveKey(recoveryKey, salt);
    
    // Encrypt master key with recovery key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedMasterKey = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        recoveryDerivedKey,
        masterKey
    );
    
    await db.settings.put({
        key: 'recoveryData',
        salt: Array.from(salt),
        iv: Array.from(iv),
        encryptedMasterKey: Array.from(new Uint8Array(encryptedMasterKey))
    });
}

// Verify and unlock with password
async function unlockWithPassword(password) {
    const setting = await db.settings.get('passwordData');
    if (!setting) return false;
    
    const passwordHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password)
    );
    
    const hashArray = Array.from(new Uint8Array(passwordHash));
    const storedHash = setting.passwordHash;
    
    // Compare hashes
    if (hashArray.length !== storedHash.length) return false;
    for (let i = 0; i < hashArray.length; i++) {
        if (hashArray[i] !== storedHash[i]) return false;
    }
    
    // Derive key from password
    const salt = new Uint8Array(setting.salt);
    const passwordKey = await deriveKey(password, salt);
    
    // Decrypt master key
    try {
        const iv = new Uint8Array(setting.iv);
        const encryptedMasterKey = new Uint8Array(setting.encryptedMasterKey);
        
        const masterKey = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            passwordKey,
            encryptedMasterKey
        );
        
        // Import master key
        encryptionKey = await crypto.subtle.importKey(
            'raw',
            masterKey,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
        
        return true;
    } catch (e) {
        return false;
    }
}

// Unlock with recovery key
async function unlockWithRecoveryKey(recoveryKey) {
    const setting = await db.settings.get('recoveryData');
    if (!setting) return false;
    
    try {
        // Derive key from recovery key
        const salt = new Uint8Array(setting.salt);
        const recoveryDerivedKey = await deriveKey(recoveryKey.trim().toLowerCase(), salt);
        
        // Decrypt master key
        const iv = new Uint8Array(setting.iv);
        const encryptedMasterKey = new Uint8Array(setting.encryptedMasterKey);
        
        const masterKey = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            recoveryDerivedKey,
            encryptedMasterKey
        );
        
        // Import master key
        encryptionKey = await crypto.subtle.importKey(
            'raw',
            masterKey,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
        
        return true;
    } catch (e) {
        return false;
    }
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
    tempPassword = null;
    tempRecoveryKey = null;
    
    document.querySelector('.container').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    
    // Hide ALL onboarding screens
    document.getElementById('onboarding-welcome').style.display = 'none';
    document.getElementById('onboarding-password').style.display = 'none';
    document.getElementById('onboarding-recovery').style.display = 'none';
    document.getElementById('onboarding-confirm').style.display = 'none';
    
    // Show only the unlock password screen
    document.getElementById('unlock-password').style.display = 'block';
    document.getElementById('unlock-recovery').style.display = 'none';
    
    // Clear any input fields
    document.getElementById('unlock-password-input').value = '';
    document.getElementById('unlock-error').textContent = '';
    document.getElementById('recovery-key-input').value = '';
    document.getElementById('recovery-unlock-error').textContent = '';
    
    // Clear in-memory data
    journalEntries = [];
    tasks = [];
    events = [];
}

// ===== Onboarding Flow Handlers =====

// Start onboarding
document.getElementById('start-onboarding-btn').addEventListener('click', () => {
    document.getElementById('onboarding-welcome').style.display = 'none';
    document.getElementById('onboarding-password').style.display = 'block';
});

// Password step - Next button
document.getElementById('password-next-btn').addEventListener('click', () => {
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
    
    // Store password temporarily
    tempPassword = password;
    
    // Generate recovery key
    tempRecoveryKey = generateRecoveryKey();
    document.getElementById('recovery-key-display').textContent = tempRecoveryKey;
    
    // Show recovery key screen
    document.getElementById('onboarding-password').style.display = 'none';
    document.getElementById('onboarding-recovery').style.display = 'block';
});

// Copy recovery key
document.getElementById('copy-recovery-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(tempRecoveryKey).then(() => {
        const btn = document.getElementById('copy-recovery-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
    }).catch(err => {
        alert('Failed to copy. Please copy manually.');
    });
});

// Download recovery key
document.getElementById('download-recovery-btn').addEventListener('click', () => {
    const text = `Mynder Recovery Key\n\nIMPORTANT: Keep this key safe and secure!\n\nYour Recovery Key:\n${tempRecoveryKey}\n\nDate: ${new Date().toLocaleString()}\n\nIf you forget your password, you can use this recovery key to regain access to your encrypted journal data.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mynder-recovery-key.txt';
    a.click();
    URL.revokeObjectURL(url);
});

// Recovery key - Next button
document.getElementById('recovery-next-btn').addEventListener('click', () => {
    document.getElementById('onboarding-recovery').style.display = 'none';
    document.getElementById('onboarding-confirm').style.display = 'block';
});

// Back to recovery key
document.getElementById('back-to-recovery-btn').addEventListener('click', () => {
    document.getElementById('onboarding-confirm').style.display = 'none';
    document.getElementById('onboarding-recovery').style.display = 'block';
    document.getElementById('confirm-recovery-input').value = '';
});

// Confirm recovery key and finish setup
document.getElementById('confirm-recovery-btn').addEventListener('click', async () => {
    const confirmedKey = document.getElementById('confirm-recovery-input').value.trim().toLowerCase();
    
    if (confirmedKey !== tempRecoveryKey.toLowerCase()) {
        alert('Recovery key does not match. Please check and try again.');
        return;
    }
    
    // Setup is complete - save everything
    const masterKey = await setupPassword(tempPassword);
    await setupRecoveryKey(tempRecoveryKey, masterKey);
    
    // Migrate existing localStorage data if any
    await migrateFromLocalStorage();
    
    // Clear temp variables
    tempPassword = null;
    tempRecoveryKey = null;
    
    // Hide lock screen and show app
    document.getElementById('lock-screen').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
    await initApp();
});

// ===== Unlock UI Handlers =====

// ===== Unlock UI Handlers =====

// Unlock with password
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

// Show recovery option
document.getElementById('show-recovery-option-btn').addEventListener('click', () => {
    document.getElementById('unlock-password').style.display = 'none';
    document.getElementById('unlock-recovery').style.display = 'block';
});

// Back to password
document.getElementById('back-to-password-btn').addEventListener('click', () => {
    document.getElementById('unlock-recovery').style.display = 'none';
    document.getElementById('unlock-password').style.display = 'block';
    document.getElementById('recovery-key-input').value = '';
    document.getElementById('recovery-unlock-error').textContent = '';
});

// Unlock with recovery key
document.getElementById('unlock-recovery-btn').addEventListener('click', async () => {
    const recoveryKey = document.getElementById('recovery-key-input').value;
    const errorEl = document.getElementById('recovery-unlock-error');
    
    if (!recoveryKey) {
        errorEl.textContent = 'Please enter your recovery key';
        return;
    }
    
    const success = await unlockWithRecoveryKey(recoveryKey);
    
    if (success) {
        errorEl.textContent = '';
        document.getElementById('lock-screen').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        await initApp();
    } else {
        errorEl.textContent = 'Invalid recovery key. Please check and try again.';
    }
});

// Lock app button
document.getElementById('lock-app-btn').addEventListener('click', () => {
    if (confirm('Lock the app? You\'ll need your password to unlock it.')) {
        lockApp();
    }
});

// Check password setup on load
async function checkPasswordSetup() {
    const hasPassword = await isPasswordSet();
    
    if (hasPassword) {
        // Returning user - show unlock screen
        document.getElementById('onboarding-welcome').style.display = 'none';
        document.getElementById('onboarding-password').style.display = 'none';
        document.getElementById('onboarding-recovery').style.display = 'none';
        document.getElementById('onboarding-confirm').style.display = 'none';
        document.getElementById('unlock-password').style.display = 'block';
        document.getElementById('unlock-recovery').style.display = 'none';
    } else {
        // New user - show welcome screen
        document.getElementById('onboarding-welcome').style.display = 'block';
        document.getElementById('onboarding-password').style.display = 'none';
        document.getElementById('onboarding-recovery').style.display = 'none';
        document.getElementById('onboarding-confirm').style.display = 'none';
        document.getElementById('unlock-password').style.display = 'none';
        document.getElementById('unlock-recovery').style.display = 'none';
    }
}

// Initialize data from localStorage (legacy - will be migrated)
let journalEntries = [];
let tasks = [];
let events = [];
let lastJournalDate = localStorage.getItem('lastJournalDate') || '';

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
        // Same day - daily user
        return getRandomWelcomeMessage('dailyUser');
    } else if (daysSinceLastAccess === 1) {
        // Yesterday - regular user
        return getRandomWelcomeMessage('regularUser');
    } else if (daysSinceLastAccess >= 2 && daysSinceLastAccess <= 4) {
        // 2-4 days - returning user
        return getRandomWelcomeMessage('returningUser');
    } else {
        // 5+ days - long absence
        return getRandomWelcomeMessage('longAbsence');
    }
}

function showWelcomeBanner(message) {
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
        // Multiple entries today - frequent user
        return getRandomMessage('frequentUser');
    }
    
    if (hour >= 22 || hour <= 2) {
        // Late night: 10pm - 2am
        return getRandomMessage('lateNight');
    }
    
    if (hour >= 3 && hour <= 5) {
        // Very early morning: 3am - 5am
        return getRandomMessage('earlyMorning');
    }
    
    if (hour >= 6 && hour <= 9) {
        // Morning: 6am - 9am
        return getRandomMessage('morning');
    }
    
    if (hour >= 18 && hour <= 21) {
        // Evening: 6pm - 9pm
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
        return '#FFF4D6'; // Warmer, more golden
    }
    
    // High pleasure + low arousal (calm/content)
    if (pleasure > 0.3 && arousal < -0.2) {
        return '#FFEEE0'; // Softer peach
    }
    
    // Low pleasure + high arousal (anxious/stressed)
    if (pleasure < -0.3 && arousal > 0.3) {
        return '#E8DFF5'; // More noticeable lavender
    }
    
    // Low pleasure + low arousal (sad/depressed)
    if (pleasure < -0.3 && arousal < -0.2) {
        return '#E0EBF5'; // Clearer blue-gray
    }
    
    // Neutral/mixed
    return '#F5F7FA'; // Slightly cooler neutral
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

// Calendar collapse/expand toggle
document.getElementById('calendar-toggle').addEventListener('click', () => {
    const calendar = document.querySelector('.mini-calendar');
    const isCollapsed = calendar.classList.toggle('collapsed');
    localStorage.setItem('calendarCollapsed', isCollapsed);
});

// Restore calendar collapse state on load
function restoreCalendarState() {
    const isCollapsed = localStorage.getItem('calendarCollapsed') === 'true';
    if (isCollapsed) {
        document.querySelector('.mini-calendar').classList.add('collapsed');
    }
}

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
    
    // Encrypt and store in Dexie
    const encrypted = await encryptData(entry);
    await db.journals.add(encrypted);
    
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

// Mood-ring toggle handler
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mood-ring-toggle');
    if (toggle) {
        // Load saved preference
        const enabled = localStorage.getItem('moodRingEnabled') !== 'false';
        toggle.checked = enabled;
        
        toggle.addEventListener('change', (e) => {
            localStorage.setItem('moodRingEnabled', e.target.checked);
            const container = document.querySelector('.container');
            
            if (e.target.checked) {
                // Re-apply mood background
                const sentiment = getMostRecentSentiment();
                if (sentiment) {
                    applyMoodBackground(sentiment);
                } else if (container) {
                    container.style.backgroundColor = '#F5F7FA';
                }
            } else {
                // Reset to white
                document.documentElement.style.setProperty('--mood-bg-color', '#ffffff');
                if (container) {
                    container.style.backgroundColor = '#ffffff';
                }
            }
        });
    }
});

// Initialize app
async function initApp() {
    renderMiniCalendar(); // Render calendar first
    restoreCalendarState(); // Restore collapse state
    await renderJournalEntries();
    await renderTasks();
    await renderEvents();
    
    // Apply mood background from most recent entry
    const recentSentiment = getMostRecentSentiment();
    if (recentSentiment) {
        applyMoodBackground(recentSentiment);
    }
    
    // Show welcome message based on last access
    const lastAccess = localStorage.getItem('lastAccess');
    const now = new Date();
    
    if (lastAccess) {
        const lastAccessDate = new Date(lastAccess);
        const daysSinceLastAccess = Math.floor((now - lastAccessDate) / (1000 * 60 * 60 * 24));
        const welcomeMsg = getWelcomeMessage(daysSinceLastAccess);
        setTimeout(() => showWelcomeBanner(welcomeMsg), 500);
    } else {
        // First time ever accessing the app
        setTimeout(() => showWelcomeBanner("Welcome to Mynder. This is your space."), 500);
    }
    
    // Update last access time
    localStorage.setItem('lastAccess', now.toISOString());
    
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

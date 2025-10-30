// --- SecureBank Agent Dashboard ---
// Professional agent management system with AI integration

// --- Configuration ---
let agentFirebaseConfig = {};

// Load Firebase config from API
async function loadFirebaseConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            agentFirebaseConfig = await response.json();
            console.log('Loaded Firebase config from API:', agentFirebaseConfig.projectId);
            return;
        }
    } catch (error) {
        console.log('API config failed, trying env-config:', error.message);
    }
    
    // Try to use the same config as the main app
    if (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey) {
        agentFirebaseConfig = firebaseConfig;
        console.log('Using main app Firebase config:', firebaseConfig.projectId);
    } else {
        console.error('No Firebase config available!');
        agentFirebaseConfig = null;
    }
}

// --- State Management ---
let currentAgent = {
    id: 'agent_' + Date.now(),
    name: '',
    avatar: '',
    title: '',
    status: 'offline',
    rating: 0,
    specializations: []
};

let activeSessions = new Map();
let generatedCodes = new Map();
let otherAgents = new Map();
let notifications = [];
let stats = {
    activeSessions: 0,
    totalCodes: 0,
    avgDuration: 0,
    satisfaction: 98
};

// --- Firebase Integration ---
let database, auth, agentsRef, sessionsRef, codesRef;
let currentUser = null;

async function initializeFirebase() {
    try {
        await loadFirebaseConfig();
        
        if (!agentFirebaseConfig) {
            throw new Error('No Firebase configuration available');
        }
        
        firebase.initializeApp(agentFirebaseConfig);
        database = firebase.database();
        auth = firebase.auth();
        agentsRef = database.ref('agents');
        sessionsRef = database.ref('sessions');
        codesRef = database.ref('access-codes');
        
        // Setup auth state listener
        auth.onAuthStateChanged(handleAuthStateChange);
        
        console.log('Firebase initialized successfully with project:', agentFirebaseConfig.projectId);
    } catch (error) {
        console.error('Firebase initialization failed:', error.message);
        showNotification('Firebase connection failed. Some features may not work.', 'warning');
    }
}

// --- Google Authentication ---
function handleAuthStateChange(user) {
    if (user) {
        currentUser = user;
        updateAgentFromAuth(user);
        console.log('User signed in:', user.displayName);
    } else {
        currentUser = null;
        showGoogleSignIn();
    }
}

function updateAgentFromAuth(user) {
    currentAgent.name = user.displayName || 'Agent';
    currentAgent.avatar = getInitials(user.displayName || 'Agent');
    currentAgent.email = user.email;
    currentAgent.photoURL = user.photoURL;
    
    updateAgentProfile();
    
    // Update settings form
    const nameInput = document.getElementById('agent-display-name');
    if (nameInput) {
        nameInput.value = currentAgent.name;
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

async function signInWithGoogle() {
    if (!auth) {
        showNotification('Authentication not available', 'error');
        return;
    }
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        showNotification(`Welcome, ${result.user.displayName}!`, 'success');
        
    } catch (error) {
        console.error('Google sign-in error:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            return;
        }
        
        let errorMessage = 'Sign-in failed. ';
        if (error.code === 'auth/unauthorized-domain') {
            errorMessage += 'Please add your domain to Firebase Auth authorized domains.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage += 'Google sign-in is not enabled in Firebase Console.';
        } else {
            errorMessage += 'Please try again.';
        }
        
        showNotification(errorMessage, 'error');
    }
}

async function signOut() {
    if (!auth) return;
    
    try {
        await auth.signOut();
        showNotification('Signed out successfully', 'info');
    } catch (error) {
        console.error('Sign-out error:', error);
        showNotification('Sign-out failed', 'error');
    }
}

function showGoogleSignIn() {
    if (!auth) {
        showNotification('Authentication not available', 'error');
        return;
    }
    
    Swal.fire({
        title: 'Sign in to VitalSwap',
        html: `
            <div style="text-align: center; padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <i class="fab fa-google" style="font-size: 48px; color: #4285f4;"></i>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-secondary);">Sign in with your Google account to access the agent dashboard</p>
                <button id="google-signin-btn" style="
                    background: #4285f4;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0 auto 16px;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#3367d6'" onmouseout="this.style.background='#4285f4'">
                    <i class="fab fa-google"></i>
                    Sign in with Google
                </button>
                <button id="demo-mode-btn" style="
                    background: var(--medium-gray);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.3s;
                " onmouseover="this.style.background='var(--dark-gray)'" onmouseout="this.style.background='var(--medium-gray)'">
                    Continue in Demo Mode
                </button>
            </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            document.getElementById('google-signin-btn').addEventListener('click', () => {
                Swal.close();
                signInWithGoogle();
            });
            document.getElementById('demo-mode-btn').addEventListener('click', () => {
                Swal.close();
                currentAgent.name = 'Demo Agent';
                currentAgent.avatar = 'DA';
                currentAgent.title = 'Banking Specialist';
                currentAgent.status = 'online';
                currentAgent.rating = 4.8;
                currentAgent.specializations = ['Personal Banking', 'Loans'];
                updateAgentProfile();
                showNotification('Running in demo mode', 'info');
            });
        }
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    initializeAgentDashboard();
});

async function initializeAgentDashboard() {
    try {
        // Initialize dashboard section first
        initializeDashboard();
        
        // Initialize Firebase first
        await initializeFirebase();
        
        // Initialize agent profile
        updateAgentProfile();
        
        // Register agent as online
        await registerAgent();
        
        // Setup real-time listeners only if Firebase is available
        if (database) {
            setupRealtimeListeners();
        }
        
        // Generate initial access code
        generateNewCode();
        
        // Load initial data
        await loadDashboardData();
        
        // Disable periodic updates to reduce Firebase traffic
        // setInterval(updateStats, 60000);
        // setInterval(updateAgentStatus, 120000);
        
        // Add sample data for demo
        addSampleData();
        
        // Load saved settings
        loadSettings();
        
        // Setup specialization click handlers
        document.querySelectorAll('.specialization-tag').forEach(tag => {
            tag.addEventListener('click', () => toggleSpecialization(tag));
        });
        
        console.log('VitalSwap Agent Dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing agent dashboard:', error);
        showNotification('Failed to initialize dashboard', 'error');
    }
}

// --- Agent Management ---
async function registerAgent() {
    try {
        const agentData = {
            ...currentAgent,
            lastSeen: Date.now(),
            activeSessions: 0,
            totalSessions: stats.totalCodes,
            rating: currentAgent.rating
        };
        
        // For demo purposes, just store locally
        console.log('Agent registered:', agentData);
        
    } catch (error) {
        console.error('Error registering agent:', error);
    }
}

function updateAgentProfile() {
    const avatarEl = document.getElementById('current-agent-avatar');
    const nameEl = document.getElementById('current-agent-name');
    const statusEl = document.getElementById('current-agent-status');
    
    if (currentAgent.photoURL && avatarEl) {
        avatarEl.innerHTML = `<img src="${currentAgent.photoURL}" alt="${currentAgent.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else if (avatarEl) {
        avatarEl.textContent = currentAgent.avatar || '';
    }
    
    if (nameEl) nameEl.textContent = currentAgent.name || 'Please sign in';
    if (statusEl) statusEl.textContent = currentAgent.name ? `${currentAgent.status} • Available` : 'Not signed in';
}

async function updateAgentStatus() {
    if (!database) return;
    
    try {
        await agentsRef.child(currentAgent.id).update({
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            activeSessions: activeSessions.size
        });
    } catch (error) {
        console.error('Error updating agent status:', error);
    }
}

// --- Code Generation ---
function generateAccessCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function generateNewCode() {
    try {
        const code = generateAccessCode();
        const expiryTime = Date.now() + (30 * 60 * 1000); // 30 minutes
        
        const codeData = {
            code: code,
            agentId: currentAgent.id,
            agentName: currentAgent.name,
            createdAt: Date.now(),
            expiresAt: expiryTime,
            status: 'active',
            used: false
        };
        
        if (database) {
            try {
                await codesRef.child(code).set(codeData);
                console.log('Code stored in Firebase');
            } catch (firebaseError) {
                console.log('Firebase error, storing locally:', firebaseError.message);
            }
        }
        
        // Store locally
        generatedCodes.set(code, codeData);
        
        // Update UI
        updateCodeDisplay(code, codeData);
        
        // Update stats
        stats.totalCodes++;
        updateStatsDisplay();
        
        // Add notification
        addNotification('New access code generated', `Code ${code} is ready for customer use`, 'success');
        
        console.log('Generated new access code:', code);
        
    } catch (error) {
        console.error('Error generating access code:', error);
        showNotification('Failed to generate access code', 'error');
    }
}

function updateCodeDisplay(code, codeData) {
    document.getElementById('current-access-code').textContent = code;
    document.getElementById('code-created').textContent = 'Just now';
    document.getElementById('code-expiry').textContent = '30 minutes';
    
    // Store current code for other functions
    window.currentCode = code;
}

// --- Code Actions ---
async function copyCode() {
    const code = document.getElementById('current-access-code').textContent;
    try {
        await navigator.clipboard.writeText(code);
        showNotification('Access code copied to clipboard', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Access code copied to clipboard', 'success');
    }
}

async function copyLink() {
    const code = document.getElementById('current-access-code').textContent;
    const link = `${window.location.origin}?code=${code}`;
    
    try {
        await navigator.clipboard.writeText(link);
        showNotification('Customer link copied to clipboard', 'success');
    } catch (error) {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Customer link copied to clipboard', 'success');
    }
}

async function showQRCode() {
    const code = document.getElementById('current-access-code').textContent;
    const link = `${window.location.origin}?code=${code}`;
    
    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        showNotification('QR code library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    try {
        // Generate QR code in the main display
        const qrContainer = document.getElementById('qr-container');
        const qrCodeElement = document.getElementById('qr-code');
        
        qrCodeElement.innerHTML = '';
        await QRCode.toCanvas(qrCodeElement, link, {
            width: 200,
            height: 200,
            colorDark: '#003d82',
            colorLight: '#ffffff',
            margin: 2
        });
        
        qrContainer.classList.remove('hidden');
        
        // Also generate for modal
        const modalQrElement = document.getElementById('modal-qr-code');
        modalQrElement.innerHTML = '';
        await QRCode.toCanvas(modalQrElement, link, {
            width: 250,
            height: 250,
            colorDark: '#003d82',
            colorLight: '#ffffff',
            margin: 2
        });
        
        document.getElementById('modal-access-code').textContent = code;
        document.getElementById('qr-modal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        showNotification('Failed to generate QR code. Please try again.', 'error');
    }
}

async function sendToCustomer() {
    const result = await Swal.fire({
        title: 'Send Access Code to Customer',
        html: `
            <div style="text-align: left; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Customer Email:</label>
                <input type="email" id="customer-email" class="swal2-input" placeholder="customer@example.com" style="margin: 0;">
            </div>
            <div style="text-align: left; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Customer Name:</label>
                <input type="text" id="customer-name" class="swal2-input" placeholder="John Smith" style="margin: 0;">
            </div>
            <div style="text-align: left;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">Message (Optional):</label>
                <textarea id="custom-message" class="swal2-textarea" placeholder="Additional message for the customer..." style="margin: 0; height: 80px;"></textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send Email',
        confirmButtonColor: '#003d82',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            const email = document.getElementById('customer-email').value;
            const name = document.getElementById('customer-name').value;
            const message = document.getElementById('custom-message').value;
            
            if (!email) {
                Swal.showValidationMessage('Please enter customer email');
                return false;
            }
            
            return { email, name, message };
        }
    });
    
    if (result.isConfirmed) {
        const { email, name, message } = result.value;
        const code = document.getElementById('current-access-code').textContent;
        
        try {
            await sendEmailWithNodemailer(email, name, code, message);
            showNotification(`Professional email sent to ${email}`, 'success');
            addNotification('Email sent to customer', `Sent code ${code} to ${name || email}`, 'info');
            
        } catch (error) {
            console.error('Error sending email:', error);
            showNotification('Failed to send email. Check your email configuration.', 'error');
        }
    }
}

// --- Nodemailer Email Function ---
async function sendEmailWithNodemailer(email, name, code, message) {
    const emailData = {
        to: email,
        name: name,
        code: code,
        message: message,
        agentName: currentAgent.name
    };
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Email sent successfully:', result);
        return result;
        
    } catch (error) {
        console.error('Nodemailer error:', error);
        // Fallback to demo email
        return await simulateEmailSend(email, name, code, message);
    }
}

async function simulateEmailSend(email, name, code, message) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real implementation, you would integrate with your email service
    console.log('Email sent:', {
        to: email,
        subject: 'Your SecureBank Virtual Booth Access Code',
        body: `
            Dear ${name || 'Valued Customer'},
            
            Your access code for the SecureBank Virtual Booth session is: ${code}
            
            Please use this code to join your consultation with ${currentAgent.name}.
            
            ${message ? `\nAdditional message: ${message}` : ''}
            
            Best regards,
            SecureBank Team
        `
    });
}

// --- Session Management ---
function setupRealtimeListeners() {
    if (!database) {
        console.log('Firebase not available, skipping real-time listeners');
        return;
    }
    
    try {
        // Listen for new sessions
        sessionsRef.on('child_added', (snapshot) => {
            const sessionData = snapshot.val();
            if (sessionData.agentId === currentAgent.id) {
                handleNewSession(snapshot.key, sessionData);
            }
        });
        
        // Listen for session updates
        sessionsRef.on('child_changed', (snapshot) => {
            const sessionData = snapshot.val();
            if (sessionData.agentId === currentAgent.id) {
                updateSession(snapshot.key, sessionData);
            }
        });
        
        // Listen for session removal
        sessionsRef.on('child_removed', (snapshot) => {
            const sessionId = snapshot.key;
            removeSession(sessionId);
        });
        
        // Listen for other agents
        agentsRef.on('value', (snapshot) => {
            const agents = snapshot.val();
            updateAgentsList(agents);
        });
        
        // Listen for code usage
        codesRef.on('child_changed', (snapshot) => {
            const codeData = snapshot.val();
            if (codeData.agentId === currentAgent.id && codeData.used) {
                handleCodeUsed(snapshot.key, codeData);
            }
        });
        
        console.log('Real-time listeners setup successfully');
        
    } catch (error) {
        console.error('Error setting up real-time listeners:', error);
    }
}

function handleNewSession(sessionId, sessionData) {
    activeSessions.set(sessionId, sessionData);
    updateSessionsList();
    updateStatsDisplay();
    
    addNotification('New session started', `Customer joined using code ${sessionData.accessCode}`, 'success');
}

function updateSession(sessionId, sessionData) {
    activeSessions.set(sessionId, sessionData);
    updateSessionsList();
}

function removeSession(sessionId) {
    activeSessions.delete(sessionId);
    updateSessionsList();
    updateStatsDisplay();
}

function handleCodeUsed(code, codeData) {
    addNotification('Access code used', `Customer joined session with code ${code}`, 'info');
}

async function updateSessionsList() {
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = '';
    
    // Get real active sessions from Firebase
    let realSessions = new Map();
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    
    if (database) {
        try {
            const snapshot = await sessionsRef.orderByChild('status').equalTo('active').once('value');
            const sessions = snapshot.val();
            
            if (sessions) {
                Object.entries(sessions).forEach(([sessionId, sessionData]) => {
                    // Only show sessions within 30 minutes and still active
                    if (sessionData.startTime > thirtyMinutesAgo) {
                        realSessions.set(sessionId, sessionData);
                    } else {
                        // Auto-terminate expired sessions
                        terminateExpiredSession(sessionId, sessionData);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching real sessions:', error);
        }
    }
    
    // Update activeSessions with real data
    activeSessions = realSessions;
    
    if (activeSessions.size === 0) {
        sessionsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="margin-bottom: 16px; opacity: 0.5;">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <h4 style="margin-bottom: 8px;">No Active Sessions</h4>
                <p>Generate an access code to start a new customer session</p>
            </div>
        `;
        return;
    }
    
    activeSessions.forEach((session, sessionId) => {
        const sessionElement = createSessionElement(sessionId, session);
        sessionsList.appendChild(sessionElement);
    });
}

async function terminateExpiredSession(sessionId, sessionData) {
    try {
        await sessionsRef.child(sessionId).update({
            status: 'expired',
            endTime: Date.now(),
            endReason: 'Session expired after 30 minutes'
        });
        
        // Clean up room data
        if (sessionData.accessCode) {
            await database.ref('rooms').child(sessionData.accessCode).remove();
        }
        
        console.log('Terminated expired session:', sessionId);
    } catch (error) {
        console.error('Error terminating expired session:', error);
    }
}

function createSessionElement(sessionId, session) {
    const div = document.createElement('div');
    div.className = 'session-item';
    
    // Use the actual session ID or generate a display ID
    const displaySessionId = session.sessionId || sessionId;
    const participantCount = session.participants || 1;
    const timeRemaining = getTimeRemaining(session.startTime);
    
    div.innerHTML = `
        <div class="session-header">
            <div class="session-code">${session.accessCode || 'N/A'}</div>
            <div class="session-status ${getStatusClass(session.status)}">
                ${session.status || 'Active'} • ${participantCount} participant${participantCount !== 1 ? 's' : ''}
            </div>
        </div>
        <div class="session-details">
            <div class="session-detail">
                <div class="detail-label">Session ID</div>
                <div class="detail-value" style="font-family: monospace; font-size: 11px;">${displaySessionId}</div>
            </div>
            <div class="session-detail">
                <div class="detail-label">Duration</div>
                <div class="detail-value">${formatDuration(session.startTime)}</div>
            </div>
            <div class="session-detail">
                <div class="detail-label">Time Left</div>
                <div class="detail-value" style="color: ${timeRemaining < 5 ? 'var(--error-red)' : 'var(--text-primary)'};">                    ${timeRemaining}m
                </div>
            </div>
            <div class="session-detail">
                <div class="detail-label">Quality</div>
                <div class="detail-value">${session.quality || 'Good'}</div>
            </div>
            <div class="session-detail">
                <div class="detail-label">Actions</div>
                <div class="detail-value">
                    <button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="joinSession('${sessionId}')">
                        Join
                    </button>
                </div>
            </div>
        </div>
    `;
    return div;
}

function getTimeRemaining(startTime) {
    const thirtyMinutes = 30 * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const remaining = thirtyMinutes - elapsed;
    
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / 60000); // Convert to minutes
}

function getStatusClass(status) {
    switch (status) {
        case 'active': return 'status-active';
        case 'waiting': return 'status-waiting';
        case 'ended': return 'status-ended';
        default: return 'status-active';
    }
}

function formatDuration(startTime) {
    if (!startTime) return '0m';
    
    const now = Date.now();
    const duration = now - startTime;
    const minutes = Math.floor(duration / 60000);
    
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

function joinSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (session && session.accessCode) {
        const sessionUrl = `${window.location.origin}?code=${session.accessCode}&agent=true`;
        const popup = window.open(sessionUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        if (!popup) {
            showNotification('Please allow popups for this site', 'warning');
        } else {
            showNotification('Joining session...', 'info');
        }
    } else {
        showNotification('Session not found or no access code available', 'error');
    }
}

// --- Agent List Management ---
function updateAgentsList(agents) {
    const agentList = document.getElementById('agent-list');
    agentList.innerHTML = '';
    
    if (!agents) return;
    
    Object.entries(agents).forEach(([agentId, agent]) => {
        if (agentId !== currentAgent.id) {
            const agentElement = createAgentElement(agentId, agent);
            agentList.appendChild(agentElement);
        }
    });
}

function createAgentElement(agentId, agent) {
    const div = document.createElement('div');
    div.className = 'agent-item';
    div.innerHTML = `
        <div class="agent-status-dot ${getAgentStatusClass(agent.status)}"></div>
        <div class="agent-avatar" style="width: 32px; height: 32px; font-size: 12px;">${agent.avatar}</div>
        <div class="agent-details">
            <div class="agent-name">${agent.name}</div>
            <div class="agent-role">${agent.title}</div>
            <div class="agent-sessions">${agent.activeSessions || 0} active sessions</div>
        </div>
    `;
    return div;
}

function getAgentStatusClass(status) {
    switch (status) {
        case 'online': return 'status-online';
        case 'busy': return 'status-busy';
        case 'away': return 'status-away';
        default: return 'status-away';
    }
}

// --- AI Integration ---
async function sendAIQuery() {
    const input = document.getElementById('ai-input');
    const query = input.value.trim();
    
    if (!query) return;
    
    // Show loading state
    const responseDiv = document.getElementById('ai-response');
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div class="loading"></div>
            <span>AI is thinking...</span>
        </div>
    `;
    
    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            responseDiv.innerHTML = `
                <div style="font-size: 14px; line-height: 1.5;">
                    <strong style="color: rgba(255,255,255,0.9); margin-bottom: 8px; display: block;">🤖 Gemini AI:</strong>
                    ${data.response.replace(/\n/g, '<br>')}
                </div>
            `;
            input.value = '';
        } else {
            const errorMsg = data.error || `HTTP ${response.status}`;
            console.error('API Error Details:', data);
            throw new Error(errorMsg);
        }
        
    } catch (error) {
        console.error('AI query error:', error);
        responseDiv.innerHTML = `
            <div style="color: #ff6b6b; font-size: 14px;">
                <strong>⚠️ Error:</strong> ${error.message.includes('GEMINI_API_KEY') ? 'API key not configured' : 'Unable to connect to AI service'}
                <br><small>Check console for details</small>
            </div>
        `;
    }
}

function handleAIKeypress(event) {
    if (event.key === 'Enter') {
        sendAIQuery();
    }
}

// --- Statistics ---
function updateStatsDisplay() {
    try {
        const activeSessionsEl = document.getElementById('active-sessions');
        if (activeSessionsEl) activeSessionsEl.textContent = activeSessions.size;
        
        const totalCodesEl = document.getElementById('total-codes');
        if (totalCodesEl) totalCodesEl.textContent = stats.totalCodes;
        
        const avgDurationEl = document.getElementById('avg-duration');
        if (avgDurationEl) avgDurationEl.textContent = `${stats.avgDuration}m`;
        
        const satisfactionEl = document.getElementById('customer-satisfaction');
        if (satisfactionEl) satisfactionEl.textContent = `${stats.satisfaction}%`;
    } catch (error) {
        console.warn('Some stats elements not found:', error.message);
    }
}

async function updateStats() {
    try {
        // Calculate average session duration
        let totalDuration = 0;
        let sessionCount = 0;
        
        activeSessions.forEach(session => {
            if (session.startTime) {
                totalDuration += Date.now() - session.startTime;
                sessionCount++;
            }
        });
        
        if (sessionCount > 0) {
            stats.avgDuration = Math.floor(totalDuration / sessionCount / 60000); // Convert to minutes
        }
        
        updateStatsDisplay();
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// --- Notifications ---
function addNotification(title, message, type = 'info') {
    const notification = {
        id: Date.now(),
        title,
        message,
        type,
        timestamp: new Date()
    };
    
    notifications.unshift(notification);
    
    // Keep only last 10 notifications
    if (notifications.length > 10) {
        notifications = notifications.slice(0, 10);
    }
    
    updateNotificationsList();
}

function updateNotificationsList() {
    const panel = document.getElementById('notification-panel');
    panel.innerHTML = '';
    
    if (notifications.length === 0) {
        panel.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                <p>No recent notifications</p>
            </div>
        `;
        return;
    }
    
    notifications.forEach(notification => {
        const element = createNotificationElement(notification);
        panel.appendChild(element);
    });
}

function createNotificationElement(notification) {
    const div = document.createElement('div');
    div.className = 'notification-item';
    
    const iconColor = {
        success: 'var(--success-green)',
        error: 'var(--error-red)',
        warning: 'var(--warning-orange)',
        info: 'var(--primary-blue)'
    }[notification.type];
    
    const icon = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    }[notification.type];
    
    div.innerHTML = `
        <div class="notification-icon" style="background: ${iconColor}; color: white;">
            ${icon}
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatTime(notification.timestamp)}</div>
        </div>
    `;
    
    return div;
}

function formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return timestamp.toLocaleDateString();
}

// --- Utility Functions ---
function showNotification(message, type = 'info') {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function downloadQR() {
    const canvas = document.querySelector('#modal-qr-code canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `access-code-${window.currentCode}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        showNotification('QR code downloaded successfully', 'success');
    }
}

function refreshSessions() {
    // Simulate refresh with loading state
    const btn = event.target;
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<div class="loading"></div> Refreshing...';
    btn.disabled = true;
    
    setTimeout(() => {
        updateSessionsList();
        btn.innerHTML = originalText;
        btn.disabled = false;
        showNotification('Sessions refreshed', 'success');
    }, 1000);
}

function showAgentProfile() {
    const avatarDisplay = currentAgent.photoURL ? 
        `<img src="${currentAgent.photoURL}" alt="${currentAgent.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px;">` :
        `<div style="width: 80px; height: 80px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 600; margin: 0 auto 16px;">${currentAgent.avatar}</div>`;
    
    Swal.fire({
        title: 'Agent Profile',
        html: `
            <div style="text-align: center; margin-bottom: 20px;">
                ${avatarDisplay}
                <h3 style="margin-bottom: 4px;">${currentAgent.name}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 8px;">${currentAgent.title}</p>
                ${currentAgent.email ? `<p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 16px;">${currentAgent.email}</p>` : ''}
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--primary-blue);">${currentAgent.rating}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Rating</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--primary-blue);">${stats.totalCodes}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Sessions</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--primary-blue);">${activeSessions.size}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Active</div>
                    </div>
                </div>
                <div style="background: var(--light-gray); padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 16px;">
                    <strong>Specializations:</strong><br>
                    ${currentAgent.specializations.join(', ')}
                </div>
                <button onclick="signOut()" style="background: var(--error-red); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
            </div>
        `,
        confirmButtonColor: '#003d82',
        confirmButtonText: 'Close'
    });
}

async function loadDashboardData() {
    try {
        console.log('Loading dashboard data...');
        
        // Load real active sessions
        await updateSessionsList();
        
        // Load active access codes
        await loadActiveCodes();
        
        // Load session history
        await loadSessionHistory();
        
        // Load analytics data
        await loadAnalyticsData();
        
        updateStatsDisplay();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadSessionHistory() {
    const historyBody = document.getElementById('session-history-body');
    if (!historyBody) return;
    
    if (!database) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                    <div>No session history available</div>
                    <div style="font-size: 12px; margin-top: 8px;">Complete sessions will appear here</div>
                </td>
            </tr>
        `;
        return;
    }
    
    try {
        const snapshot = await sessionsRef.orderByChild('endTime').limitToLast(50).once('value');
        const sessions = snapshot.val();
        
        if (!sessions) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                        <div>No completed sessions yet</div>
                        <div style="font-size: 12px; margin-top: 8px;">Session history will appear here after completion</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const completedSessions = Object.entries(sessions)
            .filter(([_, session]) => session.status === 'ended' || session.status === 'expired')
            .sort(([_, a], [__, b]) => (b.endTime || 0) - (a.endTime || 0))
            .slice(0, 20);
        
        if (completedSessions.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-secondary);">
                        <div>No completed sessions yet</div>
                        <div style="font-size: 12px; margin-top: 8px;">Session history will appear here after completion</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        historyBody.innerHTML = completedSessions.map(([sessionId, session]) => {
            const duration = session.duration ? formatSessionDuration(session.duration) : 'N/A';
            const endTime = session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A';
            const displayId = session.sessionId || sessionId.substring(0, 8);
            
            return `
                <tr style="border-bottom: 1px solid var(--light-gray);">
                    <td style="padding: 12px; font-family: monospace; font-size: 11px;">${displayId}</td>
                    <td style="padding: 12px;">${session.customerName || 'Anonymous'}</td>
                    <td style="padding: 12px;">${duration}</td>
                    <td style="padding: 12px;"><span style="color: var(--success-green); font-weight: 500;">${session.quality || 'Good'}</span></td>
                    <td style="padding: 12px; font-size: 12px;">${endTime}</td>
                    <td style="padding: 12px;"><span class="session-status status-ended">${session.status === 'expired' ? 'Expired' : 'Completed'}</span></td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading session history:', error);
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px; text-align: center; color: var(--error-red);">
                    <div>Error loading session history</div>
                    <div style="font-size: 12px; margin-top: 8px;">Please try refreshing the page</div>
                </td>
            </tr>
        `;
    }
}

function formatSessionDuration(duration) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

async function loadAnalyticsData() {
    const statsContainer = document.getElementById('analytics-stats');
    const detailsContainer = document.getElementById('analytics-details');
    
    if (!statsContainer || !detailsContainer) return;
    
    if (!database) {
        statsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary); background: var(--off-white); border-radius: 12px;">
                <div>No analytics data available</div>
                <div style="font-size: 12px; margin-top: 8px;">Analytics will be generated from completed sessions</div>
            </div>
        `;
        detailsContainer.innerHTML = '';
        return;
    }
    
    try {
        const snapshot = await sessionsRef.once('value');
        const sessions = snapshot.val();
        
        if (!sessions) {
            statsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary); background: var(--off-white); border-radius: 12px;">
                    <div>No session data available</div>
                    <div style="font-size: 12px; margin-top: 8px;">Start sessions to see analytics</div>
                </div>
            `;
            detailsContainer.innerHTML = '';
            return;
        }
        
        const sessionArray = Object.values(sessions);
        const completedSessions = sessionArray.filter(s => s.status === 'ended' || s.status === 'expired');
        const activeSessions = sessionArray.filter(s => s.status === 'active');
        
        // Calculate stats
        const totalSessions = completedSessions.length;
        const avgDuration = totalSessions > 0 ? 
            Math.round(completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions / 60000) : 0;
        const avgRating = 4.8; // Would calculate from actual ratings
        const successRate = totalSessions > 0 ? 
            Math.round((completedSessions.filter(s => s.status === 'ended').length / totalSessions) * 100) : 100;
        
        // Quality distribution
        const qualityStats = {
            excellent: completedSessions.filter(s => s.quality === 'Excellent').length,
            good: completedSessions.filter(s => s.quality === 'Good').length,
            fair: completedSessions.filter(s => s.quality === 'Fair').length
        };
        
        const total = qualityStats.excellent + qualityStats.good + qualityStats.fair;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalSessions}</div>
                <div class="stat-label">Total Sessions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgDuration}m</div>
                <div class="stat-label">Average Duration</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgRating}</div>
                <div class="stat-label">Average Rating</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${successRate}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        `;
        
        if (total > 0) {
            detailsContainer.innerHTML = `
                <div style="padding: 20px; background: var(--off-white); border-radius: 12px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 16px; color: var(--primary-blue);">Session Quality Distribution</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div style="text-align: center;">
                            <div style="font-size: 32px; font-weight: 700; color: var(--success-green);">${Math.round((qualityStats.excellent / total) * 100)}%</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Excellent Quality (${qualityStats.excellent})</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 32px; font-weight: 700; color: var(--primary-blue);">${Math.round((qualityStats.good / total) * 100)}%</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Good Quality (${qualityStats.good})</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 32px; font-weight: 700; color: var(--warning-orange);">${Math.round((qualityStats.fair / total) * 100)}%</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Fair Quality (${qualityStats.fair})</div>
                        </div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: var(--light-blue); padding: 20px; border-radius: 12px;">
                        <h4 style="margin-bottom: 12px; color: var(--primary-blue);">Active Sessions</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <div>Currently active: <strong>${activeSessions.length}</strong></div>
                            <div>Total completed: <strong>${completedSessions.length}</strong></div>
                            <div>Success rate: <strong>${successRate}%</strong></div>
                        </div>
                    </div>
                    <div style="background: var(--light-blue); padding: 20px; border-radius: 12px;">
                        <h4 style="margin-bottom: 12px; color: var(--primary-blue);">Performance</h4>
                        <div style="font-size: 14px; line-height: 1.6;">
                            <div>Avg duration: <strong>${avgDuration} minutes</strong></div>
                            <div>Avg rating: <strong>${avgRating}/5.0</strong></div>
                            <div>Generated codes: <strong>${generatedCodes.size}</strong></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--text-secondary); background: var(--off-white); border-radius: 12px;">
                    <div>No completed sessions for detailed analytics</div>
                    <div style="font-size: 12px; margin-top: 8px;">Quality distribution will appear after sessions are completed</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        statsContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--error-red); background: var(--off-white); border-radius: 12px;">
                <div>Error loading analytics data</div>
                <div style="font-size: 12px; margin-top: 8px;">Please try refreshing the page</div>
            </div>
        `;
        detailsContainer.innerHTML = '';
    }
}

async function loadActiveCodes() {
    if (!database) return;
    
    try {
        const snapshot = await codesRef.orderByChild('status').equalTo('active').once('value');
        const codes = snapshot.val();
        
        if (codes) {
            Object.entries(codes).forEach(([code, codeData]) => {
                // Only show non-expired codes
                if (codeData.expiresAt > Date.now()) {
                    generatedCodes.set(code, codeData);
                }
            });
        }
        
        stats.totalCodes = generatedCodes.size;
        
    } catch (error) {
        console.error('Error loading active codes:', error);
    }
}

// --- Navigation Functions ---
function toggleMobileMenu() {
    const nav = document.getElementById('header-nav');
    nav.classList.toggle('mobile-open');
}

window.showSection = function(sectionName) {
    try {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            if (section && section.classList) {
                section.classList.add('hidden');
            }
        });
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item && item.classList) {
                item.classList.remove('active');
            }
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection && targetSection.classList) {
            targetSection.classList.remove('hidden');
        }
        
        // Add active class to clicked nav item
        if (event && event.target && event.target.classList) {
            event.target.classList.add('active');
        } else {
            // Fallback: find the nav item by href
            const navItem = document.querySelector(`[href="#${sectionName}"]`);
            if (navItem && navItem.classList) {
                navItem.classList.add('active');
            }
        }
        
        // Close mobile menu
        const nav = document.getElementById('header-nav');
        if (nav && nav.classList) {
            nav.classList.remove('mobile-open');
        }
    } catch (error) {
        console.error('Error in showSection:', error);
    }
};

// Initialize dashboard section on load
function initializeDashboard() {
    // Wait for DOM to be ready
    setTimeout(() => {
        try {
            showSection('dashboard');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }, 100);
}

// --- Join Session Function ---
function joinSessionWithCode() {
    const code = document.getElementById('current-access-code').textContent;
    if (code && code !== 'ABC123') {
        const sessionUrl = `${window.location.origin}?code=${code}&agent=true`;
        window.open(sessionUrl, '_blank', 'width=1200,height=800');
    } else {
        showNotification('Please generate a valid access code first', 'warning');
    }
}

// --- Settings Functions ---
function saveSettings() {
    try {
        const settings = {
            displayName: document.getElementById('agent-display-name').value,
            jobTitle: document.getElementById('agent-job-title').value,
            specializations: Array.from(document.querySelectorAll('.specialization-tag.active')).map(tag => tag.dataset.spec),
            emailNotifications: document.getElementById('email-notifications').checked,
            soundAlerts: document.getElementById('sound-alerts').checked,
            autoAccept: document.getElementById('auto-accept').checked,
            maxSessions: document.getElementById('max-sessions').value
        };
        
        // Save to localStorage
        localStorage.setItem('agentSettings', JSON.stringify(settings));
        
        // Update current agent
        currentAgent.name = settings.displayName;
        currentAgent.title = settings.jobTitle;
        currentAgent.specializations = settings.specializations;
        
        // Update UI
        updateAgentProfile();
        
        showNotification('Settings saved successfully', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

function resetSettings() {
    document.getElementById('agent-display-name').value = '';
    document.getElementById('agent-job-title').value = '';
    document.getElementById('email-notifications').checked = true;
    document.getElementById('sound-alerts').checked = true;
    document.getElementById('auto-accept').checked = false;
    document.getElementById('max-sessions').value = '3';
    
    // Reset specializations
    document.querySelectorAll('.specialization-tag').forEach(tag => {
        tag.classList.remove('active');
        tag.querySelector('i').className = 'fas fa-plus';
    });
    
    localStorage.removeItem('agentSettings');
    showNotification('Settings reset to default', 'info');
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('agentSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            document.getElementById('agent-display-name').value = settings.displayName || '';
            document.getElementById('agent-job-title').value = settings.jobTitle || '';
            document.getElementById('email-notifications').checked = settings.emailNotifications !== false;
            document.getElementById('sound-alerts').checked = settings.soundAlerts !== false;
            document.getElementById('auto-accept').checked = settings.autoAccept || false;
            document.getElementById('max-sessions').value = settings.maxSessions || '3';
            
            // Load specializations
            if (settings.specializations) {
                document.querySelectorAll('.specialization-tag').forEach(tag => {
                    const isActive = settings.specializations.includes(tag.dataset.spec);
                    tag.classList.toggle('active', isActive);
                    tag.querySelector('i').className = isActive ? 'fas fa-check' : 'fas fa-plus';
                });
            }
            
            // Update current agent
            currentAgent.name = settings.displayName || '';
            currentAgent.title = settings.jobTitle || '';
            currentAgent.specializations = settings.specializations || [];
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// --- Specialization Toggle ---
function toggleSpecialization(element) {
    element.classList.toggle('active');
    const icon = element.querySelector('i');
    icon.className = element.classList.contains('active') ? 'fas fa-check' : 'fas fa-plus';
}

// --- Export Functions ---
function exportSessions() {
    showNotification('Session data exported successfully', 'success');
}

// --- Sample Data for Demo ---
function addSampleData() {
    // Add sample notifications
    addNotification('Welcome to VitalSwap', 'Agent dashboard initialized successfully', 'success');
    addNotification('System Update', 'New features available in the latest update', 'info');
    
    // Add sample agents
    const sampleAgents = [
        { id: 'agent_2', name: 'Sarah Johnson', avatar: 'SJ', title: 'Loan Specialist', status: 'online', activeSessions: 2 },
        { id: 'agent_3', name: 'Michael Chen', avatar: 'MC', title: 'Investment Advisor', status: 'busy', activeSessions: 1 },
        { id: 'agent_4', name: 'Emily Davis', avatar: 'ED', title: 'Business Banking', status: 'away', activeSessions: 0 }
    ];
    
    const agentListElement = document.getElementById('agent-list');
    sampleAgents.forEach(agent => {
        const element = createAgentElement(agent.id, agent);
        agentListElement.appendChild(element);
    });
    
    // Don't add sample sessions - only show real ones
    updateSessionsList();
    
    // Update stats with real data
    stats.avgDuration = 0;
    stats.satisfaction = 98;
    stats.totalCodes = generatedCodes.size;
    updateStatsDisplay();
}

// --- Cleanup on page unload ---
window.addEventListener('beforeunload', async () => {
    if (!database) return;
    
    try {
        await agentsRef.child(currentAgent.id).update({
            status: 'offline',
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error('Error updating agent status on unload:', error);
    }
});

// --- Global Error Handler ---
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    addNotification('System Error', 'An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    addNotification('System Error', 'An unexpected error occurred', 'error');
});

console.log('VitalSwap Agent Dashboard loaded successfully');

// --- Agent Dashboard Chat Integration ---
function showAgentCustomerChat() {
    Swal.fire({
        title: 'Customer Messages',
        html: `
            <div style="text-align: left; margin-bottom: 20px;">
                <div id="customer-messages" style="height: 300px; overflow-y: auto; border: 1px solid var(--light-gray); border-radius: 8px; padding: 16px; margin-bottom: 16px; background: var(--off-white);">
                    <div style="text-align: center; color: var(--text-secondary); padding: 20px;">Customer messages will appear here</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="agent-reply-input" placeholder="Reply to customer..." style="flex: 1; padding: 12px; border: 2px solid var(--light-gray); border-radius: 8px; font-size: 14px;" onkeypress="handleAgentReplyKeypress(event)">
                    <button onclick="sendAgentReply()" style="background: var(--primary-blue); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button onclick="sendAgentQuickReply('Your access code is: ' + (window.currentCode || 'ABC123'))" style="background: var(--success-green); color: white; border: none; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">Send Access Code (Broadcast)</button>
                    <button onclick="sendAgentQuickReply('I will be with you shortly. Please wait.')" style="background: var(--primary-blue); color: white; border: none; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">Please Wait (Broadcast)</button>
                    <button onclick="sendAgentQuickReply('Thank you for contacting us. How can I help you today?')" style="background: var(--primary-blue); color: white; border: none; padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">Greeting (Broadcast)</button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Close',
        width: '600px',
        didOpen: () => {
            setupCustomerMessagesListener();
            loadCustomerMessages();
        },
        willClose: () => {
            if (window.customerMessagesRef) {
                window.customerMessagesRef.off();
            }
        }
    });
}

function handleAgentReplyKeypress(event) {
    if (event.key === 'Enter') {
        sendAgentReply();
    }
}

function sendAgentReply() {
    const input = document.getElementById('agent-reply-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    sendAgentQuickReply(message);
    input.value = '';
}

function sendAgentQuickReply(message, targetCustomerId = null) {
    if (!database) return;
    
    const messageData = {
        text: message,
        sender: currentAgent?.name || 'Banking Agent',
        senderId: currentAgent?.id || 'agent_' + Date.now(),
        senderType: 'agent',
        timestamp: Date.now(),
        status: 'sent',
        targetCustomerId: targetCustomerId, // Specific customer or null for broadcast
        broadcast: !targetCustomerId // If no target, it's a broadcast
    };
    
    // Save to Firebase
    database.ref('customer-agent-chat').push(messageData);
    
    // Add to local display
    addCustomerMessage(messageData);
}

function addCustomerMessage(messageData) {
    const messagesDiv = document.getElementById('customer-messages');
    if (!messagesDiv) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 8px;
        ${messageData.senderType === 'agent' ? 'background: var(--primary-blue); color: white; margin-left: 20px;' : 'background: var(--light-gray); color: var(--text-primary); margin-right: 20px;'}
    `;
    
    const timeString = new Date(messageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div style="font-weight: 500; margin-bottom: 4px;">${messageData.sender}</div>
        <div style="margin-bottom: 4px;">${messageData.text}</div>
        <div style="font-size: 11px; opacity: 0.7;">${timeString}</div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function setupCustomerMessagesListener() {
    if (!database) return;
    
    window.customerMessagesRef = database.ref('customer-agent-chat');
    window.customerMessagesRef.on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        if (messageData) {
            addCustomerMessage(messageData);
        }
    });
}

function loadCustomerMessages() {
    if (!database) return;
    
    database.ref('customer-agent-chat').limitToLast(20).once('value', (snapshot) => {
        const messages = snapshot.val();
        if (messages) {
            Object.values(messages).forEach(messageData => {
                addCustomerMessage(messageData);
            });
        }
    });
}
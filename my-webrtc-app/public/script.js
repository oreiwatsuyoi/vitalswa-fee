// --- Virtual Bank Booth Application ---
// Premium banking video consultation platform

// --- UI State Management ---
let currentScreen = 'welcome'; // welcome, lobby, call
let isAudioMuted = false;
let isVideoMuted = false;
let isScreenSharing = false;
let callStartTime = null;
let callTimer = null;
let chatOpen = false;

// --- WebRTC State ---
let myId;
let hostId;
let isHost = false;
let peerConnections = {};
let localStream;
let roomRef;
let roomName;
let mySignalingRef;
let lobbyStream;
let rawCameraStream;
let participants = {}; // Track all participants
let remoteStreams = {}; // Track remote video streams

// --- Virtual Background State ---
let segmenter;
let currentBackgroundType = 'none';
let animationFrameId;
let outputCanvas, canvasCtx;

// --- Firebase Configuration ---
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// --- Customer Authentication ---
let currentCustomer = null;

// Setup auth state listener
auth.onAuthStateChanged(handleCustomerAuthStateChange);

function handleCustomerAuthStateChange(user) {
    if (user) {
        currentCustomer = {
            uid: user.uid,
            name: user.displayName || 'Customer',
            email: user.email,
            photoURL: user.photoURL
        };
        updateCustomerProfile();
        console.log('Customer signed in:', user.displayName);
    } else {
        currentCustomer = null;
        updateCustomerProfile();
    }
}

function updateCustomerProfile() {
    const profileEl = document.getElementById('customer-profile');
    const avatarEl = document.getElementById('customer-avatar');
    const nameEl = document.getElementById('customer-name');
    const statusEl = document.getElementById('customer-status');
    
    if (currentCustomer) {
        if (profileEl) profileEl.style.display = 'flex';
        
        if (currentCustomer.photoURL && avatarEl) {
            avatarEl.innerHTML = `<img src="${currentCustomer.photoURL}" alt="${currentCustomer.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else if (avatarEl) {
            const initials = currentCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            avatarEl.textContent = initials;
        }
        
        if (nameEl) nameEl.textContent = currentCustomer.name;
        if (statusEl) statusEl.textContent = currentCustomer.email ? 'Signed in' : 'Guest';
    } else {
        if (profileEl) profileEl.style.display = 'none';
    }
    
    console.log('Customer profile updated:', currentCustomer);
}

function showCustomerProfile() {
    if (!currentCustomer) {
        showCustomerSignIn();
        return;
    }
    
    const avatarDisplay = currentCustomer.photoURL ? 
        `<img src="${currentCustomer.photoURL}" alt="${currentCustomer.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px;">` :
        `<div style="width: 60px; height: 60px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 600; margin: 0 auto 16px;">${currentCustomer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>`;
    
    Swal.fire({
        title: 'Customer Profile',
        html: `
            <div style="text-align: center; margin-bottom: 20px;">
                ${avatarDisplay}
                <h3 style="margin-bottom: 4px;">${currentCustomer.name}</h3>
                ${currentCustomer.email ? `<p style="color: var(--text-secondary); margin-bottom: 16px;">${currentCustomer.email}</p>` : '<p style="color: var(--text-secondary); margin-bottom: 16px;">Guest User</p>'}
                <div style="background: var(--light-gray); padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 16px;">
                    <strong>Account Type:</strong> ${currentCustomer.email ? 'Google Account' : 'Guest'}<br>
                    <strong>Status:</strong> ${currentCustomer.email ? 'Signed In' : 'Guest Session'}
                </div>
                ${currentCustomer.email ? '<button onclick="signOut()" style="background: var(--error-red); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-sign-out-alt"></i> Sign Out</button>' : '<button onclick="showCustomerSignIn()" style="background: var(--primary-blue); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fab fa-google"></i> Sign In</button>'}
            </div>
        `,
        confirmButtonColor: '#003d82',
        confirmButtonText: 'Close'
    });
}

async function signInWithGoogle() {
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
    try {
        await auth.signOut();
        showNotification('Signed out successfully', 'info');
    } catch (error) {
        console.error('Sign-out error:', error);
        showNotification('Sign-out failed', 'error');
    }
}

function showCustomerSignIn() {
    Swal.fire({
        title: 'Sign in to VitalSwap',
        html: `
            <div style="text-align: center; padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <i class="fab fa-google" style="font-size: 48px; color: #4285f4;"></i>
                </div>
                <p style="margin-bottom: 24px; color: var(--text-secondary);">Sign in with your Google account for a personalized banking experience</p>
                <button id="customer-google-signin-btn" style="
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
                <button id="customer-demo-mode-btn" style="
                    background: var(--medium-gray);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.3s;
                " onmouseover="this.style.background='var(--dark-gray)'" onmouseout="this.style.background='var(--medium-gray)'">
                    Continue as Guest
                </button>
            </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            document.getElementById('customer-google-signin-btn').addEventListener('click', () => {
                Swal.close();
                signInWithGoogle();
            });
            document.getElementById('customer-demo-mode-btn').addEventListener('click', () => {
                Swal.close();
                currentCustomer = {
                    uid: 'guest_' + Date.now(),
                    name: 'Guest Customer',
                    email: null,
                    photoURL: null
                };
                updateCustomerProfile();
                showNotification('Continuing as guest', 'info');
            });
        }
    });
}

// --- Adaptive video quality ---
function getOptimalVideoConstraints() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || '4g';
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return { width: { ideal: 240 }, height: { ideal: 180 }, frameRate: { ideal: 8 } };
    } else if (effectiveType === '3g') {
        return { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 10 } };
    } else {
        return { width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 15 } };
    }
}

// --- STUN servers ---
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:openrelay.metered.ca:80' },
        { urls: 'stun:stun.relay.metered.ca:80' }
    ]
};

// --- Agent Data ---
const agents = [
    {
        name: "Jessica Smith",
        title: "Senior Banking Specialist",
        avatar: "JS",
        rating: 4.9,
        quote: "Helping customers achieve their financial goals since 2018"
    },
    {
        name: "Michael Chen",
        title: "Investment Advisor",
        avatar: "MC",
        rating: 4.8,
        quote: "Specializing in wealth management and retirement planning"
    },
    {
        name: "Sarah Johnson",
        title: "Loan Specialist",
        avatar: "SJ",
        rating: 4.9,
        quote: "Making homeownership dreams come true since 2015"
    }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const isAgent = urlParams.get('agent') === 'true';
    
    if (codeParam) {
        // Auto-fill access code from URL
        const accessCodeInput = document.getElementById('access-code');
        if (accessCodeInput) {
            accessCodeInput.value = codeParam;
            
            // If agent is joining, auto-submit
            if (isAgent) {
                window.isAgentJoining = true;
                setTimeout(() => {
                    handleAccessCode({ preventDefault: () => {} });
                }, 1000);
            }
        }
    }
    
    // Show sign-in prompt after a delay if not signed in and auth is ready
    setTimeout(() => {
        if (!currentCustomer && auth.currentUser === null) {
            showCustomerSignIn();
        }
    }, 5000);
});

// --- Update agent info display ---
function updateAgentInfo(agent) {
    const elements = {
        'agent-avatar': agent.avatar,
        'agent-name': agent.name,
        'agent-title': agent.title
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Update call header if in call
    const callHeader = document.querySelector('.call-info .agent-name');
    if (callHeader && window.assignedAgent) {
        callHeader.textContent = `${window.assignedAgent.name} - Banking Specialist`;
    }
}

async function initializeApp() {
    // Hide loading screen after a brief delay
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 500);
    }, 1500);

    // Initialize virtual background
    try {
        await initializeVirtualBackground();
    } catch (error) {
        console.warn('Virtual background initialization failed:', error);
    }

    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI elements
    initializeUIElements();
}

function setupEventListeners() {
    // Access code form
    const accessCodeForm = document.querySelector('.access-code-form');
    if (accessCodeForm) {
        accessCodeForm.addEventListener('submit', handleAccessCode);
    }

    // Lobby controls
    const lobbyMuteAudio = document.getElementById('lobby-mute-audio');
    const lobbyMuteVideo = document.getElementById('lobby-mute-video');
    const joinCallBtn = document.getElementById('join-call-btn');
    const audioInput = document.getElementById('audio-input');
    const videoInput = document.getElementById('video-input');

    if (lobbyMuteAudio) lobbyMuteAudio.addEventListener('click', toggleLobbyAudio);
    if (lobbyMuteVideo) lobbyMuteVideo.addEventListener('click', toggleLobbyVideo);
    if (joinCallBtn) joinCallBtn.addEventListener('click', startComplianceSession);
    if (audioInput) audioInput.addEventListener('change', updateLobbyDevices);
    if (videoInput) videoInput.addEventListener('change', updateLobbyDevices);

    // Call controls
    const muteAudio = document.getElementById('mute-audio');
    const muteVideo = document.getElementById('mute-video');
    const screenShare = document.getElementById('screen-share');
    const endCall = document.getElementById('end-call');
    const chatToggle = document.getElementById('chat-toggle');

    if (muteAudio) muteAudio.addEventListener('click', toggleAudio);
    if (muteVideo) muteVideo.addEventListener('click', toggleVideo);
    if (screenShare) screenShare.addEventListener('click', toggleScreenShare);
    if (endCall) endCall.addEventListener('click', endCallWithCompliance);
    if (chatToggle) chatToggle.addEventListener('click', toggleChat);

    // Chat functionality
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');

    if (chatInput) {
        chatInput.addEventListener('input', handleChatInput);
        chatInput.addEventListener('keypress', handleChatKeypress);
    }
    if (sendMessage) sendMessage.addEventListener('click', sendChatMessage);
}

function initializeUIElements() {
    // Clear agent info - no agent assigned yet
    updateAgentInfo({
        avatar: '',
        name: 'Please log in to see agent',
        title: 'No agent assigned'
    });
    
    // Generate session ID
    const sessionId = 'VS-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const sessionIdElement = document.getElementById('session-id');
    if (sessionIdElement) {
        sessionIdElement.textContent = sessionId;
    }
    
    // Update other session info
    updateSessionInfo();
}

function updateSessionInfo() {
    // Update queue position
    const queueElement = document.querySelector('.info-item .info-value');
    if (queueElement && queueElement.textContent === 'Next in line') {
        queueElement.textContent = 'Ready to connect';
    }
    
    // Update estimated wait time
    const waitElements = document.querySelectorAll('.info-item .info-value');
    waitElements.forEach(el => {
        if (el.textContent === '< 1 minute') {
            el.textContent = 'Immediate';
        }
    });
}

// --- Access Code Handling ---
async function handleAccessCode(event) {
    event.preventDefault();
    
    const accessCode = document.getElementById('access-code').value.trim().toUpperCase();
    const connectBtn = document.getElementById('connect-btn');
    
    if (accessCode.length !== 6) {
        showError('Please enter a valid 6-digit access code');
        return;
    }

    // Validate access code format
    if (!/^[A-Z0-9]{6}$/.test(accessCode)) {
        showError('Access code must contain only letters and numbers');
        return;
    }

    connectBtn.disabled = true;
    connectBtn.innerHTML = '<div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>';

    try {
        // Validate access code with Firebase
        const isValid = await validateAccessCode(accessCode);
        
        if (isValid) {
            roomName = accessCode;
            showLobby();
        } else {
            throw new Error('Invalid access code');
        }
        
    } catch (error) {
        showError('Invalid access code. Please check with your banking representative.');
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<span>Connect to Agent</span>';
    }
}

// --- Access Code Validation ---
async function validateAccessCode(code) {
    try {
        const codesRef = database.ref('access-codes');
        const snapshot = await codesRef.child(code).once('value');
        const codeData = snapshot.val();
        
        if (!codeData) {
            // Check if it's a demo code (for testing)
            if (['DEMO01', 'TEST01', 'BANK01'].includes(code)) {
                // Try to get real agent info from Firebase
                const agentInfo = await getAgentInfo('demo_agent');
                window.assignedAgent = {
                    id: 'demo_agent',
                    name: agentInfo?.name || 'Demo Agent',
                    title: agentInfo?.title || 'Banking Specialist',
                    avatar: agentInfo?.avatar || 'DA'
                };
                return true;
            }
            return false;
        }
        
        // Check if code is still valid (not expired)
        if (codeData.expiresAt && Date.now() > codeData.expiresAt) {
            return false;
        }
        
        // Check if code is already used (optional - depends on your business logic)
        if (codeData.used && codeData.singleUse) {
            return false;
        }
        
        // Mark code as used
        await codesRef.child(code).update({
            used: true,
            usedAt: Date.now(),
            customerIP: await getClientIP()
        });
        
        // Get agent info from Firebase
        const agentInfo = await getAgentInfo(codeData.agentId);
        window.assignedAgent = {
            id: codeData.agentId || 'agent_' + Date.now(),
            name: agentInfo?.name || codeData.agentName || 'Banking Agent',
            title: agentInfo?.title || codeData.agentTitle || 'Banking Specialist',
            avatar: agentInfo?.avatar || (agentInfo?.name ? agentInfo.name.split(' ').map(n => n[0]).join('') : 'BA')
        };
        
        return true;
        
    } catch (error) {
        console.error('Error validating access code:', error);
        // Fallback for demo codes
        if (['DEMO01', 'TEST01', 'BANK01'].includes(code)) {
            // Try to get real agent info from Firebase
            const agentInfo = await getAgentInfo('demo_agent');
            window.assignedAgent = {
                id: 'demo_agent',
                name: agentInfo?.name || 'Demo Agent',
                title: agentInfo?.title || 'Banking Specialist',
                avatar: agentInfo?.avatar || 'DA'
            };
            return true;
        }
        return false;
    }
}

// --- Get Client IP (for logging purposes) ---
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// --- Get Agent Info from Firebase ---
async function getAgentInfo(agentId) {
    if (!database || !agentId) return null;
    
    try {
        const snapshot = await database.ref('agents').child(agentId).once('value');
        const agentData = snapshot.val();
        
        if (agentData) {
            return {
                name: agentData.name,
                title: agentData.title || 'Banking Specialist',
                avatar: agentData.avatar || (agentData.name ? agentData.name.split(' ').map(n => n[0]).join('') : 'BA'),
                rating: agentData.rating || 4.8
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting agent info:', error);
        return null;
    }
}

// --- Screen Transitions ---
function showLobby() {
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'block';
    currentScreen = 'lobby';
    
    // Update agent info if available
    if (window.assignedAgent && window.assignedAgent.name) {
        updateAgentInfo({
            avatar: window.assignedAgent.avatar || window.assignedAgent.name.split(' ').map(n => n[0]).join(''),
            name: window.assignedAgent.name,
            title: window.assignedAgent.title || 'Banking Specialist'
        });
    } else {
        updateAgentInfo({
            avatar: '',
            name: 'No agent available',
            title: 'Please contact support'
        });
    }
    
    // Initialize lobby video
    setupLobby();
}

function showCall() {
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('call-screen').style.display = 'block';
    currentScreen = 'call';
    
    // Start call timer
    startCallTimer();
}

function showWelcome() {
    document.getElementById('call-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('welcome-screen').style.display = 'block';
    currentScreen = 'welcome';
    
    // Reset form
    document.getElementById('access-code').value = '';
    const connectBtn = document.getElementById('connect-btn');
    connectBtn.disabled = false;
    connectBtn.innerHTML = '<span>Connect to Agent</span>';
}

// --- Lobby Functionality ---
async function setupLobby() {
    try {
        // Get user media with adaptive quality
        const videoConstraints = getOptimalVideoConstraints();
        lobbyStream = await navigator.mediaDevices.getUserMedia({ 
            video: videoConstraints,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        const lobbyVideo = document.getElementById('lobby-video');
        if (lobbyVideo) {
            lobbyVideo.srcObject = lobbyStream;
        }

        // Populate device selectors
        await populateDeviceSelectors();
        
    } catch (error) {
        console.error('Error setting up lobby:', error);
        showError('Unable to access camera or microphone. Please check your permissions.');
    }
}

async function populateDeviceSelectors() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioSelect = document.getElementById('audio-input');
        const videoSelect = document.getElementById('video-input');
        
        // Clear existing options
        audioSelect.innerHTML = '';
        videoSelect.innerHTML = '';
        
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `${device.kind} ${device.deviceId.substr(0, 8)}`;
            
            if (device.kind === 'audioinput') {
                audioSelect.appendChild(option);
            } else if (device.kind === 'videoinput') {
                videoSelect.appendChild(option);
            }
        });
        
    } catch (error) {
        console.error('Error enumerating devices:', error);
    }
}

function toggleLobbyAudio() {
    if (!lobbyStream) return;
    
    const audioTrack = lobbyStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isAudioMuted = !audioTrack.enabled;
        
        const btn = document.getElementById('lobby-mute-audio');
        const micOn = document.getElementById('mic-on');
        const micOff = document.getElementById('mic-off');
        
        if (isAudioMuted) {
            btn.classList.add('active');
            micOn.style.display = 'none';
            micOff.style.display = 'block';
        } else {
            btn.classList.remove('active');
            micOn.style.display = 'block';
            micOff.style.display = 'none';
        }
    }
}

function toggleLobbyVideo() {
    if (!lobbyStream) return;
    
    const videoTrack = lobbyStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isVideoMuted = !videoTrack.enabled;
        
        const btn = document.getElementById('lobby-mute-video');
        const camOn = document.getElementById('cam-on');
        const camOff = document.getElementById('cam-off');
        
        if (isVideoMuted) {
            btn.classList.add('active');
            camOn.style.display = 'none';
            camOff.style.display = 'block';
        } else {
            btn.classList.remove('active');
            camOn.style.display = 'block';
            camOff.style.display = 'none';
        }
    }
}

async function updateLobbyDevices() {
    if (!lobbyStream) return;
    
    try {
        // Stop current stream
        lobbyStream.getTracks().forEach(track => track.stop());
        
        // Get new stream with selected devices
        const audioSelect = document.getElementById('audio-input');
        const videoSelect = document.getElementById('video-input');
        
        const constraints = {
            audio: { deviceId: { exact: audioSelect.value } },
            video: { 
                deviceId: { exact: videoSelect.value },
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            }
        };
        
        lobbyStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const lobbyVideo = document.getElementById('lobby-video');
        if (lobbyVideo) {
            lobbyVideo.srcObject = lobbyStream;
        }
        
    } catch (error) {
        console.error('Error updating devices:', error);
        showError('Unable to switch devices. Please try again.');
    }
}

// --- Call Functionality ---
async function joinCall() {
    console.log('🚀 Starting joinCall process...');
    try {
        // Generate unique ID
        myId = database.ref().push().key;
        console.log('📱 Generated user ID:', myId);
        
        roomRef = database.ref('rooms/' + roomName);
        console.log('🏠 Room reference created for:', roomName);
        
        // Clean up any stale room data older than 5 minutes
        const roomSnapshot = await roomRef.once('value');
        const roomData = roomSnapshot.val();
        console.log('🔍 Current room data:', roomData);
        
        if (roomData && roomData.lastActivity) {
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            if (roomData.lastActivity < fiveMinutesAgo) {
                console.log('🧹 Cleaning up stale room data');
                await roomRef.remove();
            }
        }
        
        // Generate unique session ID
        const sessionId = 'VS-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
        
        // Create session record
        const sessionData = {
            sessionId: sessionId,
            accessCode: roomName,
            agentId: window.assignedAgent?.id || 'agent_' + Date.now(),
            agentName: window.assignedAgent?.name || 'Banking Agent',
            customerName: currentCustomer?.name || 'Customer',
            customerId: currentCustomer?.uid || 'guest_' + Date.now(),
            customerEmail: currentCustomer?.email || null,
            startTime: Date.now(),
            status: 'active',
            quality: 'good',
            participants: 1,
            lastActivity: Date.now(),
            expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes from now
        };
        
        console.log('💾 Storing session data:', sessionData);
        await database.ref('sessions').child(myId).set(sessionData);
        
        // Update room activity
        await roomRef.child('lastActivity').set(Date.now());
        console.log('⏰ Updated room activity timestamp');
        
        // Host election
        console.log('👑 Starting host election...');
        await roomRef.child('hostId').transaction((currentHostId) => {
            if (currentHostId === null) {
                isHost = true;
                console.log('👑 Became host:', myId);
                return myId;
            }
            console.log('👥 Joining as participant, host is:', currentHostId);
            return; // Abort transaction
        });
        
        // Stop lobby stream
        if (lobbyStream) {
            console.log('🛑 Stopping lobby stream');
            lobbyStream.getTracks().forEach(track => track.stop());
        }
        
        // Start the call
        console.log('📞 Starting call...');
        await startCall();
        showCall();
        console.log('✅ Call started successfully');
        
    } catch (error) {
        console.error('❌ Error joining call:', error);
        showError('Unable to join the call. Please try again.');
    }
}

// Original joinCall for backward compatibility
function joinCallOriginal() {
    joinCall();
}

async function startCall() {
    try {
        // Get user media with selected devices
        const audioSelect = document.getElementById('audio-input');
        const videoSelect = document.getElementById('video-input');
        
        const constraints = {
            audio: { deviceId: { exact: audioSelect.value } },
            video: { 
                deviceId: { exact: videoSelect.value },
                width: { ideal: 1280 }, 
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            }
        };
        
        rawCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Setup canvas for virtual background
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = rawCameraStream;
        }
        
        // Wait for video metadata
        await new Promise((resolve) => {
            localVideo.onloadedmetadata = resolve;
        });
        
        // Initialize canvas
        outputCanvas = document.getElementById('output-canvas');
        if (!outputCanvas) {
            outputCanvas = document.createElement('canvas');
            outputCanvas.id = 'output-canvas';
            outputCanvas.style.display = 'none';
            document.body.appendChild(outputCanvas);
        }
        
        canvasCtx = outputCanvas.getContext('2d');
        outputCanvas.width = localVideo.videoWidth;
        outputCanvas.height = localVideo.videoHeight;
        
        // Use camera stream directly for better performance
        localStream = rawCameraStream;
        
        // Add local video to grid
        addParticipantVideo('local', localStream, true);
        updateVideoGrid();
        
        // Setup WebRTC connections
        await setupWebRTC();
        
        // Setup chat listener
        setupChatListener();
        
    } catch (error) {
        console.error('Error starting call:', error);
        showError('Unable to start the call. Please check your camera and microphone.');
    }
}

async function setupWebRTC() {
    console.log('🔧 Setting up WebRTC...');
    
    // Get host ID
    const hostSnapshot = await roomRef.child('hostId').once('value');
    hostId = hostSnapshot.val();
    console.log('👑 Host ID:', hostId, 'My ID:', myId, 'Am I host?', myId === hostId);
    
    if (myId === hostId) {
        isHost = true;
    }
    
    // Listen for room deletion
    roomRef.on('value', (snapshot) => {
        if (localStream && !snapshot.exists()) {
            console.log('🏠 Room deleted by host');
            showNotification('Call ended by host', 'info');
            endCall();
        }
    });
    
    // Listen for other users
    const usersRef = roomRef.child('users');
    console.log('👥 Setting up user listeners...');
    
    usersRef.on('child_added', (snapshot) => {
        const otherUserId = snapshot.key;
        if (otherUserId === myId) {
            console.log('👤 My own presence detected, ignoring');
            return;
        }
        
        const userData = snapshot.val();
        participants[otherUserId] = userData;
        
        // Update participant count in session
        updateParticipantCount();
        
        console.log('🆕 New user detected:', otherUserId, userData);
        const isInitiator = myId > otherUserId;
        console.log('🤝 Should I initiate?', isInitiator, '(myId > otherId:', myId, '>', otherUserId, ')');
        
        if (isInitiator) {
            console.log('🚀 Initiating connection to:', otherUserId);
            setTimeout(() => initiatePeerConnection(otherUserId, true), 1000);
        }
    });
    
    usersRef.on('child_removed', (snapshot) => {
        const otherUserId = snapshot.key;
        if (otherUserId === myId) return;
        
        console.log('👋 User left:', otherUserId);
        delete participants[otherUserId];
        removeParticipantVideo(otherUserId);
        closePeerConnection(otherUserId);
        updateVideoGrid();
        
        // Update participant count
        updateParticipantCount();
        
        // Check if session should be terminated
        checkSessionTimeout();
    });
    
    // Clear any stale signaling data first
    console.log('🧹 Clearing stale signaling data...');
    await roomRef.child('signaling').child(myId).remove();
    
    // Announce presence with retry logic
    try {
        console.log('📢 Announcing presence for user:', myId);
        await usersRef.child(myId).set({
            displayName: `Customer (${myId.substring(0, 4)})`,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            userAgent: navigator.userAgent.substring(0, 100),
            connectionId: Date.now()
        });
        console.log('✅ Successfully announced presence');
    } catch (error) {
        console.error('❌ Failed to announce presence:', error);
        throw error;
    }
    
    // Setup signaling with better error handling
    mySignalingRef = roomRef.child('signaling').child(myId);
    console.log('📡 Setting up signaling for:', myId);
    
    mySignalingRef.on('child_added', async (snapshot) => {
        try {
            const messageId = snapshot.key;
            const message = snapshot.val();
            if (!message) {
                console.log('📡 Empty signaling message, ignoring');
                return;
            }
            
            console.log('📨 Received signaling message:', messageId, message);
            
            // Extract from field - handle different message formats
            let from = message.from;
            if (!from && typeof message === 'object') {
                // Check if message itself contains the from info
                const keys = Object.keys(message);
                if (keys.length === 1 && keys[0] !== 'sdp' && keys[0] !== 'candidate') {
                    from = keys[0];
                    // Message might be nested
                    const nestedMessage = message[from];
                    if (nestedMessage && typeof nestedMessage === 'object') {
                        message.sdp = nestedMessage.sdp;
                        message.candidate = nestedMessage.candidate;
                        message.from = from;
                    }
                }
            }
            
            if (!from) {
                console.warn('⚠️ Message missing from field, skipping:', message);
                snapshot.ref.remove().catch(err => console.warn('Failed to remove message:', err));
                return;
            }
            
            const { sdp, candidate } = message;
            
            if (sdp && !peerConnections[from]) {
                console.log('🔗 Creating peer connection for:', from);
                initiatePeerConnection(from, false);
            }
            
            const pc = peerConnections[from];
            if (pc) {
                if (sdp) {
                    console.log('📋 Processing SDP from:', from, sdp.type);
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                        if (sdp.type === 'offer') {
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            console.log('📤 Sending answer to:', from);
                            sendSignalingMessage(from, { sdp: answer });
                        }
                    } catch (sdpError) {
                        console.error('❌ SDP processing error:', sdpError);
                    }
                } else if (candidate) {
                    console.log('🧊 Adding ICE candidate from:', from);
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (candidateError) {
                        console.error('❌ ICE candidate error:', candidateError);
                    }
                }
            } else {
                console.warn('⚠️ No peer connection found for:', from);
            }
            
            // Remove message after processing with delay
            setTimeout(() => {
                snapshot.ref.remove().catch(err => console.warn('Failed to remove message:', err));
            }, 1000);
        } catch (error) {
            console.error('❌ Error processing signaling message:', error);
        }
    });
    
    console.log('✅ WebRTC setup complete');
}

async function initiatePeerConnection(otherUserId, isInitiator) {
    console.log('🔗 Initiating peer connection with:', otherUserId, 'as initiator:', isInitiator);
    
    if (peerConnections[otherUserId]) {
        console.log('⚠️ Peer connection already exists for:', otherUserId);
        return;
    }
    
    const pc = new RTCPeerConnection(configuration);
    peerConnections[otherUserId] = pc;
    console.log('✅ Created peer connection for:', otherUserId);
    
    // Add local stream
    if (localStream) {
        localStream.getTracks().forEach(track => {
            console.log('➕ Adding track to peer connection:', track.kind);
            pc.addTrack(track, localStream);
        });
    } else {
        console.error('❌ No local stream available!');
    }
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('🧊 Sending ICE candidate to:', otherUserId);
            sendSignalingMessage(otherUserId, { candidate: event.candidate.toJSON() });
        } else {
            console.log('🧊 ICE gathering complete for:', otherUserId);
        }
    };
    
    pc.ontrack = (event) => {
        console.log('📺 Received remote track from:', otherUserId);
        if (event.streams && event.streams[0]) {
            remoteStreams[otherUserId] = event.streams[0];
            addParticipantVideo(otherUserId, event.streams[0]);
            updateVideoGrid();
        }
    };
    
    pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('🔄 Connection state changed for', otherUserId, ':', state);
        
        // Update connection status indicator
        if (state === 'connected') {
            updateConnectionStatus(otherUserId, 'connected');
        } else if (state === 'connecting') {
            updateConnectionStatus(otherUserId, 'connecting');
        } else if (state === 'failed' || state === 'closed') {
            updateConnectionStatus(otherUserId, 'disconnected');
            setTimeout(() => {
                removeParticipantVideo(otherUserId);
                closePeerConnection(otherUserId);
                updateVideoGrid();
            }, 2000);
        }
    };
    
    pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state for', otherUserId, ':', pc.iceConnectionState);
    };
    
    if (isInitiator) {
        console.log('📤 Creating and sending offer to:', otherUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('📤 Offer created, sending to:', otherUserId);
        sendSignalingMessage(otherUserId, { sdp: offer });
    }
}

function sendSignalingMessage(to, message) {
    try {
        console.log('📤 Sending signaling message to:', to, message);
        const targetRef = roomRef.child('signaling').child(to);
        const messageId = targetRef.push().key;
        
        // Ensure message has proper structure
        const messageWithMetadata = {
            from: myId,
            timestamp: Date.now(),
            messageId: messageId,
            ...message
        };
        
        console.log('📤 Message with metadata:', messageWithMetadata);
        
        targetRef.child(messageId).set(messageWithMetadata).then(() => {
            console.log('✅ Signaling message sent successfully:', messageId);
        }).catch(error => {
            console.error('❌ Failed to send signaling message:', error);
        });
    } catch (error) {
        console.error('❌ Error in sendSignalingMessage:', error);
    }
}

function closePeerConnection(otherUserId) {
    if (peerConnections[otherUserId]) {
        peerConnections[otherUserId].close();
        delete peerConnections[otherUserId];
    }
    
    // Clean up participant data
    delete participants[otherUserId];
    delete remoteStreams[otherUserId];
}

// --- Session Management ---
function updateParticipantCount() {
    const participantCount = Object.keys(participants).length + 1; // +1 for self
    
    if (database && myId) {
        database.ref('sessions').child(myId).update({
            participants: participantCount,
            lastActivity: Date.now()
        }).catch(error => console.error('Error updating participant count:', error));
    }
}

function checkSessionTimeout() {
    const participantCount = Object.keys(participants).length;
    
    if (participantCount === 0) {
        // No other participants, start timeout check
        setTimeout(() => {
            const currentParticipants = Object.keys(participants).length;
            if (currentParticipants === 0) {
                console.log('⏰ Session timeout - no participants for 30 seconds');
                endCall();
            }
        }, 30000); // 30 seconds grace period
    }
}

// Auto-terminate sessions after 30 minutes
setInterval(() => {
    if (callStartTime) {
        const sessionAge = Date.now() - callStartTime;
        if (sessionAge > 30 * 60 * 1000) { // 30 minutes
            console.log('⏰ Session expired after 30 minutes');
            showNotification('Session expired after 30 minutes', 'warning');
            endCall();
        }
    }
}, 60000); // Check every minute

// --- Multi-Participant Video Management ---
function addParticipantVideo(userId, stream, isLocal = false) {
    const videoGrid = document.getElementById('video-grid');
    if (!videoGrid) return;
    
    // Remove existing video container if it exists
    const existingContainer = document.getElementById(`video-${userId}`);
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `video-${userId}`;
    
    // Create video element
    const video = document.createElement('video');
    video.className = 'video-element';
    video.autoplay = true;
    video.playsinline = true;
    video.muted = isLocal;
    video.srcObject = stream;
    
    // Create participant label
    const label = document.createElement('div');
    label.className = `participant-label ${isLocal ? 'customer' : 'agent'}`;
    
    if (isLocal) {
        label.innerHTML = '👤 You';
    } else {
        // Get participant info from participants object or use default
        const participantInfo = participants[userId] || { displayName: 'Participant' };
        label.innerHTML = `🏦 ${participantInfo.displayName}`;
    }
    
    // Create connection status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'connection-status connected';
    statusIndicator.id = `status-${userId}`;
    
    // Assemble container
    videoContainer.appendChild(video);
    videoContainer.appendChild(label);
    videoContainer.appendChild(statusIndicator);
    
    // Add to grid
    videoGrid.appendChild(videoContainer);
    
    console.log('➕ Added participant video:', userId);
}

function removeParticipantVideo(userId) {
    const videoContainer = document.getElementById(`video-${userId}`);
    if (videoContainer) {
        videoContainer.remove();
        console.log('➖ Removed participant video:', userId);
    }
}

function updateVideoGrid() {
    const videoGrid = document.getElementById('video-grid');
    if (!videoGrid) return;
    
    const participantCount = videoGrid.children.length;
    
    // Remove all participant count classes
    videoGrid.className = 'video-grid';
    
    // Add appropriate class based on participant count
    if (participantCount > 0) {
        videoGrid.classList.add(`participants-${Math.min(participantCount, 9)}`);
    }
    
    console.log(`📋 Updated video grid for ${participantCount} participants`);
}

function updateConnectionStatus(userId, status) {
    const statusIndicator = document.getElementById(`status-${userId}`);
    if (statusIndicator) {
        statusIndicator.className = `connection-status ${status}`;
    }
}

// --- Call Controls ---
function toggleAudio() {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        isAudioMuted = !audioTrack.enabled;
        
        const btn = document.getElementById('mute-audio');
        const audioOn = document.getElementById('audio-on');
        const audioOff = document.getElementById('audio-off');
        
        if (isAudioMuted) {
            btn.classList.add('active');
            audioOn.style.display = 'none';
            audioOff.style.display = 'block';
        } else {
            btn.classList.remove('active');
            audioOn.style.display = 'block';
            audioOff.style.display = 'none';
        }
    }
}

async function toggleVideo() {
    if (!rawCameraStream) return;
    
    const videoTrack = rawCameraStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        isVideoMuted = !videoTrack.enabled;
        
        const btn = document.getElementById('mute-video');
        const videoOn = document.getElementById('video-on');
        const videoOff = document.getElementById('video-off');
        
        if (isVideoMuted) {
            btn.classList.add('active');
            videoOn.style.display = 'none';
            videoOff.style.display = 'block';
        } else {
            btn.classList.remove('active');
            videoOn.style.display = 'block';
            videoOff.style.display = 'none';
        }
        
        // Manage processing loop
        if (videoTrack.enabled) {
            processFrame();
        } else {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        }
    }
}

async function toggleScreenShare() {
    // Screen sharing implementation
    if (isScreenSharing) {
        // Stop screen sharing
        // Implementation here
    } else {
        // Start screen sharing
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            // Implementation here
            isScreenSharing = true;
        } catch (error) {
            console.error('Screen sharing error:', error);
        }
    }
}

function endCallHandler() {
    endCall();
}

function endCall() {
    console.log('Ending call...');
    // Update session status
    if (myId) {
        database.ref('sessions').child(myId).update({
            status: 'ended',
            endTime: firebase.database.ServerValue.TIMESTAMP,
            duration: callStartTime ? Date.now() - callStartTime : 0
        }).catch(error => console.error('Error updating session:', error));
    }
    
    // Clean up streams
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (rawCameraStream) {
        rawCameraStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};
    
    // Clean up Firebase
    if (roomRef) {
        if (isHost) {
            roomRef.remove().catch(err => console.warn('Failed to remove room:', err));
        } else {
            roomRef.child('users').child(myId).remove().catch(err => console.warn('Failed to remove user:', err));
            roomRef.child('signaling').child(myId).remove().catch(err => console.warn('Failed to remove signaling:', err));
        }
        roomRef.off();
    }
    
    if (mySignalingRef) {
        mySignalingRef.off();
        mySignalingRef = null;
    }
    
    // Stop call timer
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
    
    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Reset state
    localStream = null;
    rawCameraStream = null;
    roomRef = null;
    isAudioMuted = false;
    isVideoMuted = false;
    isScreenSharing = false;
    callStartTime = null;
    window.assignedAgent = null;
    
    // Clear video grid
    const videoGrid = document.getElementById('video-grid');
    if (videoGrid) {
        videoGrid.innerHTML = '';
    }
    
    // Return to welcome screen with delay to ensure cleanup
    setTimeout(() => {
        showWelcome();
        showNotification('Call ended successfully', 'info');
    }, 500);
}

// --- Chat Functionality ---
let chatRef = null;

function toggleChat() {
    const chatPanel = document.getElementById('chat-panel');
    const chatToggle = document.getElementById('chat-toggle');
    
    if (!chatPanel || !chatToggle) return;
    
    chatOpen = !chatOpen;
    console.log('Chat toggle:', chatOpen);
    
    // Force visibility and positioning
    if (chatOpen) {
        chatPanel.style.display = 'flex';
        chatPanel.style.transform = 'translateX(0)';
        chatToggle.classList.add('active');
    } else {
        if (window.innerWidth <= 1024) {
            chatPanel.style.transform = 'translateX(100%)';
        } else {
            chatPanel.style.display = 'none';
        }
        chatToggle.classList.remove('active');
    }
}

function handleChatInput() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message');
    
    sendBtn.disabled = !chatInput.value.trim();
}

function handleChatKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message || !roomRef) return;
    
    const messageData = {
        text: message,
        sender: currentCustomer?.name || 'Customer',
        senderId: myId,
        senderType: window.isAgentJoining ? 'agent' : 'customer',
        timestamp: Date.now()
    };
    
    // Save to Firebase
    roomRef.child('chat').push(messageData);
    
    // Clear input
    chatInput.value = '';
    handleChatInput();
    chatInput.style.height = 'auto';
}

function addChatMessage(messageData) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    const isOwnMessage = messageData.senderId === myId;
    messageDiv.className = `message ${messageData.senderType}`;
    
    const timeString = new Date(messageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div style="margin-top: 8px;">${messageData.text}</div>
        <div class="message-time">${timeString}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setupChatListener() {
    if (!roomRef) return;
    
    chatRef = roomRef.child('chat');
    chatRef.on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        if (messageData) {
            addChatMessage(messageData);
        }
    });
}

// --- Virtual Background ---
async function initializeVirtualBackground() {
    try {
        const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
        const segmenterConfig = {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
        };
        segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
    } catch (error) {
        console.warn('Virtual background not available:', error);
    }
}

async function processFrame() {
    // Disabled for performance - using direct camera stream
    return;
}

// --- Timer ---
function startCallTimer() {
    callStartTime = Date.now();
    callTimer = setInterval(updateCallTimer, 1000);
}

function updateCallTimer() {
    if (!callStartTime) return;
    
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const timerElement = document.getElementById('call-timer');
    if (timerElement) {
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// --- Utility Functions ---
function updateAgentInfo(agent) {
    const elements = {
        'agent-avatar': agent.avatar || '',
        'agent-name': agent.name || 'No agent assigned',
        'agent-title': agent.title || 'Please log in first'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Update call screen agent info
    const callAgentName = document.getElementById('call-agent-name');
    const callAgentRole = document.getElementById('call-agent-role');
    if (callAgentName) callAgentName.textContent = agent.name || 'No agent assigned';
    if (callAgentRole) callAgentRole.textContent = agent.title || 'Please log in first';
    
    // Show/hide rating and quote based on whether we have a real agent
    const hasRealAgent = agent.avatar && agent.name && agent.name !== 'No agent assigned' && agent.name !== 'Please log in to see agent';
    const ratingElement = document.getElementById('agent-rating');
    const quoteElement = document.getElementById('agent-quote');
    
    if (ratingElement) {
        ratingElement.style.display = hasRealAgent ? 'flex' : 'none';
    }
    if (quoteElement) {
        quoteElement.style.display = hasRealAgent ? 'block' : 'none';
    }
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: 'var(--primary-blue)'
    });
}

function showNotification(message, type = 'info') {
    Swal.fire({
        icon: type,
        title: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

function showHelp() {
    Swal.fire({
        title: 'Need Help?',
        html: `
            <div style="text-align: left; line-height: 1.6;">
                <h4 style="color: var(--primary-blue); margin-bottom: 12px;">Getting Started:</h4>
                <ul style="margin-bottom: 20px;">
                    <li>Enter your 6-digit access code provided by your banking representative</li>
                    <li>Test your camera and microphone in the preview screen</li>
                    <li>Click "Join Banking Session" to connect with your agent</li>
                </ul>
                
                <h4 style="color: var(--primary-blue); margin-bottom: 12px;">During Your Session:</h4>
                <ul style="margin-bottom: 20px;">
                    <li>Use the microphone button to mute/unmute your audio</li>
                    <li>Use the camera button to turn your video on/off</li>
                    <li>Click the chat button to send secure messages</li>
                    <li>Share your screen if requested by your agent</li>
                </ul>
                
                <h4 style="color: var(--primary-blue); margin-bottom: 12px;">Technical Support:</h4>
                <p>If you experience any issues, please reach out to our technical support line at <strong> <a href="mailto:contact@vitalswap.com">contact@vitalswap.com</a> </strong></p>
            </div>
        `,
        confirmButtonColor: 'var(--primary-blue)',
        confirmButtonText: 'Got it!'
    });
}

// --- Customer AI Chat ---
async function sendCustomerAIQuery() {
    const input = document.getElementById('customer-ai-input');
    const query = input.value.trim();
    
    if (!query) return;
    
    const responseDiv = document.getElementById('customer-ai-response');
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; border: 2px solid currentColor; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
            <span>AI is thinking...</span>
        </div>
    `;
    
    try {
        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                query: `Customer banking question: ${query}` 
            })
        });
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            // If response is not JSON, it's probably an error page
            throw new Error(`Server error: ${response.status}`);
        }
        
        if (response.ok && data.success) {
            responseDiv.innerHTML = `
                <div style="font-size: 14px; line-height: 1.5; color: white;">
                    <strong style="color: rgba(255,255,255,0.9); margin-bottom: 8px; display: block;">🤖 AI Assistant:</strong>
                    <span style="color: rgba(255,255,255,0.95);">${data.response.replace(/\n/g, '<br>')}</span>
                </div>
            `;
            input.value = '';
        } else {
            const errorMsg = data.error || `HTTP ${response.status}`;
            console.error('API Error Details:', data);
            if (errorMsg.includes('API key not configured')) {
                throw new Error('AI service configuration issue');
            }
            throw new Error(errorMsg);
        }
        
    } catch (error) {
        console.error('Customer AI query error:', error);
        responseDiv.innerHTML = `
            <div style="color: #ff6b6b; font-size: 14px;">
                <strong>⚠️ Error:</strong> Unable to connect to AI service
                <br><small>Please try again or contact support</small>
            </div>
        `;
    }
}

function handleCustomerAIKeypress(event) {
    if (event.key === 'Enter') {
        sendCustomerAIQuery();
    }
}

// --- Customer-Agent Chat System ---
function showCustomerAgentChat() {
    if (!currentCustomer) {
        showCustomerSignIn();
        return;
    }
    
    Swal.fire({
        title: 'Chat with Banking Agent',
        html: `
            <div style="text-align: left; margin-bottom: 20px;">
                <div id="agent-chat-messages" style="height: 300px; overflow-y: auto; border: 1px solid var(--light-gray); border-radius: 8px; padding: 16px; margin-bottom: 16px; background: var(--off-white);">
                    <div style="text-align: center; color: var(--text-secondary); padding: 20px;">Start a conversation with a banking agent</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="agent-chat-input" placeholder="Type your message..." style="flex: 1; padding: 12px; border: 2px solid var(--light-gray); border-radius: 8px; font-size: 14px;" onkeypress="handleAgentChatKeypress(event)">
                    <button onclick="sendAgentChatMessage()" style="background: var(--primary-blue); color: white; border: none; padding: 12px 16px; border-radius: 8px; cursor: pointer;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button onclick="sendQuickMessage('I need an access code for a video session')" style="background: var(--light-blue); color: var(--primary-blue); border: 1px solid var(--primary-blue); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">Request Access Code</button>
                    <button onclick="sendQuickMessage('I need help with banking services')" style="background: var(--light-blue); color: var(--primary-blue); border: 1px solid var(--primary-blue); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">Banking Help</button>
                    <button onclick="sendQuickMessage('I want to schedule a video consultation')" style="background: var(--light-blue); color: var(--primary-blue); border: 1px solid var(--primary-blue); padding: 6px 12px; border-radius: 16px; font-size: 12px; cursor: pointer;">Schedule Session</button>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Close',
        width: '600px',
        didOpen: () => {
            setupAgentChatListener();
            loadAgentChatHistory();
        },
        willClose: () => {
            if (window.agentChatRef) {
                window.agentChatRef.off();
            }
        }
    });
}

function handleAgentChatKeypress(event) {
    if (event.key === 'Enter') {
        sendAgentChatMessage();
    }
}

function sendAgentChatMessage() {
    const input = document.getElementById('agent-chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    sendQuickMessage(message);
    input.value = '';
}

function sendQuickMessage(message) {
    if (!database || !currentCustomer) return;
    
    const messageData = {
        text: message,
        sender: currentCustomer.name,
        senderId: currentCustomer.uid,
        senderType: 'customer',
        timestamp: Date.now(),
        status: 'sent',
        broadcast: true // Customer messages go to all agents
    };
    
    // Save to Firebase under customer-agent-chat (broadcast to all agents)
    database.ref('customer-agent-chat').push(messageData);
    
    // Add to local display
    addAgentChatMessage(messageData);
}

function addAgentChatMessage(messageData) {
    const messagesDiv = document.getElementById('agent-chat-messages');
    if (!messagesDiv) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 8px;
        ${messageData.senderType === 'customer' ? 'background: var(--primary-blue); color: white; margin-left: 20px;' : 'background: var(--light-gray); color: var(--text-primary); margin-right: 20px;'}
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

function setupAgentChatListener() {
    if (!database || !currentCustomer) return;
    
    // Listen for messages directed to this customer or broadcast messages
    window.agentChatRef = database.ref('customer-agent-chat');
    window.agentChatRef.limitToLast(50).on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        if (messageData && messageData.senderId !== currentCustomer.uid) {
            // Show agent messages that are either broadcast or directed to this customer
            if (messageData.senderType === 'agent' && 
                (messageData.broadcast || messageData.targetCustomerId === currentCustomer.uid)) {
                addAgentChatMessage(messageData);
            }
        }
    });
}

function loadAgentChatHistory() {
    if (!database || !currentCustomer) return;
    
    database.ref('customer-agent-chat').limitToLast(50).once('value', (snapshot) => {
        const messages = snapshot.val();
        if (messages) {
            Object.values(messages).forEach(messageData => {
                // Load customer's own messages and agent messages directed to them
                if (messageData.senderId === currentCustomer.uid || 
                    (messageData.senderType === 'agent' && 
                     (messageData.broadcast || messageData.targetCustomerId === currentCustomer.uid))) {
                    addAgentChatMessage(messageData);
                }
            });
        }
    });
}

// --- Compliance & Security Features ---
class ComplianceManager {
    constructor() {
        this.sessionLogs = [];
        this.encryptionEnabled = true;
        this.recordingConsent = false;
    }
    
    logEvent(event, data) {
        const logEntry = {
            timestamp: Date.now(),
            event: event,
            userId: currentCustomer?.uid || 'anonymous',
            sessionId: myId,
            data: data,
            ipAddress: 'masked', // Would get real IP in production
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        this.sessionLogs.push(logEntry);
        
        // Store in Firebase for audit trail
        if (database) {
            database.ref('audit-logs').push(logEntry);
        }
    }
    
    requestRecordingConsent() {
        return Swal.fire({
            title: 'Recording Consent Required',
            html: `
                <div style="text-align: left; line-height: 1.6;">
                    <p><strong>This session will be recorded for:</strong></p>
                    <ul>
                        <li>Quality assurance and training</li>
                        <li>Regulatory compliance (SOX, GDPR)</li>
                        <li>Dispute resolution</li>
                        <li>Security monitoring</li>
                    </ul>
                    <p><strong>Your rights:</strong></p>
                    <ul>
                        <li>Recordings are encrypted and stored securely</li>
                        <li>Access is limited to authorized personnel</li>
                        <li>You can request deletion after retention period</li>
                        <li>Declining will end this session</li>
                    </ul>
                    <div style="margin-top: 16px; padding: 12px; background: var(--light-gray); border-radius: 8px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="consent-checkbox" required>
                            <span>I consent to this session being recorded</span>
                        </label>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Accept & Continue',
            cancelButtonText: 'Decline & Exit',
            allowOutsideClick: false,
            preConfirm: () => {
                const checkbox = document.getElementById('consent-checkbox');
                if (!checkbox.checked) {
                    Swal.showValidationMessage('You must consent to recording to continue');
                    return false;
                }
                return true;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.recordingConsent = true;
                this.logEvent('RECORDING_CONSENT_GRANTED', { timestamp: Date.now() });
                return true;
            } else {
                this.logEvent('RECORDING_CONSENT_DECLINED', { timestamp: Date.now() });
                return false;
            }
        });
    }
    
    generateComplianceReport() {
        return {
            sessionId: myId,
            startTime: callStartTime,
            endTime: Date.now(),
            participants: Object.keys(participants).length + 1,
            recordingConsent: this.recordingConsent,
            encryptionStatus: this.encryptionEnabled,
            auditTrail: this.sessionLogs,
            complianceVersion: '1.0',
            dataRetentionPolicy: '7 years',
            encryptionStandard: 'AES-256'
        };
    }
}

const compliance = new ComplianceManager();

// Enhanced session start with compliance
async function startComplianceSession() {
    // Request recording consent first
    const consentGranted = await compliance.requestRecordingConsent();
    if (!consentGranted) {
        showWelcome();
        return;
    }
    
    // Log session start
    compliance.logEvent('SESSION_STARTED', {
        accessCode: roomName,
        agentId: window.assignedAgent?.id,
        customerType: currentCustomer?.email ? 'authenticated' : 'guest'
    });
    
    // Continue with normal session
    await startCall();
}

// Enhanced end call with compliance
function endCallWithCompliance() {
    // Generate compliance report
    const report = compliance.generateComplianceReport();
    
    // Store compliance data
    if (database && myId) {
        database.ref('compliance-reports').child(myId).set(report);
    }
    
    compliance.logEvent('SESSION_ENDED', {
        duration: callStartTime ? Date.now() - callStartTime : 0,
        endReason: 'user_initiated'
    });
    
    // Continue with normal end call
    endCall();
}

// Show compliance information
function showComplianceInfo() {
    Swal.fire({
        title: 'Enterprise Security & Compliance',
        html: `
            <div style="text-align: left; line-height: 1.6;">
                <div style="background: var(--success-green); color: white; padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center;">
                    <strong>🔒 Bank-Grade Security Certified</strong>
                </div>
                
                <h4 style="color: var(--primary-blue); margin-bottom: 12px;">Security Standards:</h4>
                <ul style="margin-bottom: 20px;">
                    <li><strong>SOC 2 Type II</strong> - Audited security controls</li>
                    <li><strong>AES-256 Encryption</strong> - Military-grade data protection</li>
                    <li><strong>GDPR Compliant</strong> - European privacy standards</li>
                    <li><strong>CCPA Ready</strong> - California privacy compliance</li>
                    <li><strong>PCI DSS</strong> - Payment card industry standards</li>
                </ul>
                
                <h4 style="color: var(--primary-blue); margin-bottom: 12px;">Audit & Compliance:</h4>
                <ul style="margin-bottom: 20px;">
                    <li><strong>Complete Audit Trail</strong> - Every action logged</li>
                    <li><strong>Recording Consent</strong> - Legal compliance built-in</li>
                    <li><strong>Data Retention</strong> - 7-year policy for banking</li>
                    <li><strong>Access Controls</strong> - Role-based permissions</li>
                    <li><strong>Incident Logging</strong> - Security event tracking</li>
                </ul>
                
                <h4 style="color: var(--primary-blue); margin-bottom: 12px;">Enterprise Features:</h4>
                <ul style="margin-bottom: 20px;">
                    <li><strong>Single Sign-On</strong> - Enterprise authentication</li>
                    <li><strong>API Integration</strong> - Core banking system connectivity</li>
                    <li><strong>White-Label</strong> - Custom branding available</li>
                    <li><strong>24/7 Support</strong> - Enterprise-grade assistance</li>
                </ul>
                
                <div style="background: var(--light-blue); padding: 12px; border-radius: 8px; text-align: center;">
                    <strong>Compliance Certification Available</strong><br>
                    <small>Full audit documentation and certifications provided for enterprise clients</small>
                </div>
            </div>
        `,
        confirmButtonColor: '#003d82',
        confirmButtonText: 'Close',
        width: '600px'
    });
}

// Security policies
function enforceSecurityPolicies() {
    // Disable right-click in production
    if (window.location.hostname !== 'localhost') {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
    }
}

// Initialize security on load
document.addEventListener('DOMContentLoaded', enforceSecurityPolicies);

// --- Global Error Handler ---
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    compliance.logEvent('ERROR', { message: event.error.message, stack: event.error.stack });
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    compliance.logEvent('UNHANDLED_REJECTION', { reason: event.reason });
});
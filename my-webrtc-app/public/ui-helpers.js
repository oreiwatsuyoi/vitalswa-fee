// --- UI Helper Functions for SecureBank Virtual Booth ---

// --- Animation Utilities ---
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.min(progress / duration, 1);
        
        element.style.opacity = opacity;
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
    let start = null;
    const initialOpacity = parseFloat(getComputedStyle(element).opacity);
    
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.max(initialOpacity - (progress / duration), 0);
        
        element.style.opacity = opacity;
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            element.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

function slideUp(element, duration = 300) {
    element.style.transform = 'translateY(30px)';
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const percent = Math.min(progress / duration, 1);
        
        const translateY = 30 * (1 - percent);
        element.style.transform = `translateY(${translateY}px)`;
        element.style.opacity = percent;
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

// --- Input Formatting ---
function formatAccessCode(input) {
    // Auto-format access code as user types
    let value = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (value.length > 6) {
        value = value.substring(0, 6);
    }
    
    input.value = value;
    
    // Add visual feedback
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.disabled = value.length !== 6;
    }
}

// --- Auto-resize Textarea ---
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
}

// --- Device Status Indicators ---
function updateDeviceStatus(deviceType, isEnabled) {
    const statusIndicators = document.querySelectorAll(`.${deviceType}-status`);
    statusIndicators.forEach(indicator => {
        indicator.classList.toggle('enabled', isEnabled);
        indicator.classList.toggle('disabled', !isEnabled);
    });
}

// --- Connection Quality Indicator ---
function updateConnectionQuality(quality) {
    const indicator = document.getElementById('connection-quality');
    if (!indicator) return;
    
    const qualities = ['poor', 'fair', 'good', 'excellent'];
    qualities.forEach(q => indicator.classList.remove(q));
    indicator.classList.add(quality);
    
    const text = {
        poor: 'Poor Connection',
        fair: 'Fair Connection', 
        good: 'Good Connection',
        excellent: 'Excellent Connection'
    };
    
    indicator.textContent = text[quality] || 'Unknown';
}

// --- Notification System ---
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
    }
    
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 4px 16px rgba(0, 61, 130, 0.12);
            border-left: 4px solid var(--${this.getColor(type)});
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="color: var(--${this.getColor(type)}); flex-shrink: 0;">
                    ${icon}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">
                        ${this.getTitle(type)}
                    </div>
                    <div style="color: var(--text-secondary);">
                        ${message}
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0; font-size: 18px;">×</button>
            </div>
        `;
        
        this.container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        this.notifications.push(notification);
        return notification;
    }
    
    remove(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    getColor(type) {
        const colors = {
            success: 'success-green',
            error: 'error-red',
            warning: 'warning-orange',
            info: 'primary-blue'
        };
        return colors[type] || 'primary-blue';
    }
    
    getIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };
        return icons[type] || icons.info;
    }
    
    getTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    }
}

// Initialize notification manager
const notifications = new NotificationManager();

// --- Loading States ---
function showLoadingState(element, text = 'Loading...') {
    const originalContent = element.innerHTML;
    element.dataset.originalContent = originalContent;
    element.disabled = true;
    
    element.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <div style="width: 16px; height: 16px; border: 2px solid currentColor; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>${text}</span>
        </div>
    `;
}

function hideLoadingState(element) {
    const originalContent = element.dataset.originalContent;
    if (originalContent) {
        element.innerHTML = originalContent;
        delete element.dataset.originalContent;
    }
    element.disabled = false;
}

// --- Responsive Utilities ---
function isMobile() {
    return window.innerWidth <= 768;
}

function isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktop() {
    return window.innerWidth > 1024;
}

// --- Accessibility Helpers ---
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
    
    firstElement.focus();
}

// --- Performance Monitoring ---
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            connectionTime: 0,
            videoQuality: 'unknown',
            audioQuality: 'unknown',
            latency: 0
        };
    }
    
    startConnectionTimer() {
        this.connectionStartTime = performance.now();
    }
    
    endConnectionTimer() {
        if (this.connectionStartTime) {
            this.metrics.connectionTime = performance.now() - this.connectionStartTime;
            console.log(`Connection established in ${this.metrics.connectionTime.toFixed(2)}ms`);
        }
    }
    
    updateVideoQuality(stats) {
        // Analyze WebRTC stats to determine video quality
        if (stats.framesPerSecond >= 25 && stats.frameWidth >= 720) {
            this.metrics.videoQuality = 'excellent';
        } else if (stats.framesPerSecond >= 20 && stats.frameWidth >= 480) {
            this.metrics.videoQuality = 'good';
        } else if (stats.framesPerSecond >= 15) {
            this.metrics.videoQuality = 'fair';
        } else {
            this.metrics.videoQuality = 'poor';
        }
        
        updateConnectionQuality(this.metrics.videoQuality);
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// --- Event Listeners for Enhanced UX ---
document.addEventListener('DOMContentLoaded', function() {
    // Auto-format access code input
    const accessCodeInput = document.getElementById('access-code');
    if (accessCodeInput) {
        accessCodeInput.addEventListener('input', function() {
            formatAccessCode(this);
        });
        
        // Prevent paste of invalid characters
        accessCodeInput.addEventListener('paste', function(e) {
            setTimeout(() => formatAccessCode(this), 0);
        });
    }
    
    // Auto-resize chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
    
    // Handle window resize for responsive behavior
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Trigger responsive updates
            const event = new CustomEvent('responsiveUpdate', {
                detail: {
                    isMobile: isMobile(),
                    isTablet: isTablet(),
                    isDesktop: isDesktop()
                }
            });
            window.dispatchEvent(event);
        }, 250);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only handle shortcuts during call
        if (currentScreen !== 'call') return;
        
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'm':
                    e.preventDefault();
                    toggleAudio();
                    announceToScreenReader(isAudioMuted ? 'Microphone muted' : 'Microphone unmuted');
                    break;
                case 'e':
                    e.preventDefault();
                    toggleVideo();
                    announceToScreenReader(isVideoMuted ? 'Camera off' : 'Camera on');
                    break;
                case '/':
                    e.preventDefault();
                    toggleChat();
                    announceToScreenReader(chatOpen ? 'Chat opened' : 'Chat closed');
                    break;
            }
        }
        
        // Escape key to close modals/panels
        if (e.key === 'Escape') {
            if (chatOpen && (isMobile() || isTablet())) {
                toggleChat();
            }
        }
    });
});

// --- Export for global use ---
window.UIHelpers = {
    fadeIn,
    fadeOut,
    slideUp,
    formatAccessCode,
    autoResizeTextarea,
    updateDeviceStatus,
    updateConnectionQuality,
    notifications,
    showLoadingState,
    hideLoadingState,
    isMobile,
    isTablet,
    isDesktop,
    announceToScreenReader,
    trapFocus,
    performanceMonitor
};
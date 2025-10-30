# SecureBank Virtual Booth

A premium virtual banking consultation platform that enables secure, face-to-face video meetings between customers and banking specialists. Built with modern web technologies and designed with a professional white and blue aesthetic.

## 🏦 Features

### Customer Experience
- **Secure Access**: 6-digit access code system for authenticated sessions
- **Professional UI**: Premium white and blue design with smooth animations
- **Device Testing**: Pre-call lobby with camera and microphone testing
- **HD Video Calling**: High-quality video communication with banking agents
- **Secure Chat**: Encrypted in-session messaging
- **Screen Sharing**: Ability to share documents and screens when needed
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices

### Banking Agent Features
- **Agent Profiles**: Display of agent information, ratings, and specializations
- **Session Management**: Real-time session information and queue status
- **Call Controls**: Professional call interface with mute, video, and screen sharing
- **Chat Integration**: Secure messaging during video sessions
- **Call Recording**: Optional session recording for compliance (when enabled)

### Technical Features
- **WebRTC Technology**: Peer-to-peer video communication
- **Firebase Backend**: Real-time database for signaling and session management
- **Virtual Backgrounds**: AI-powered background replacement (optional)
- **Responsive Design**: Adaptive UI for all screen sizes
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance Monitoring**: Connection quality indicators and metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- Firebase project with Realtime Database enabled
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-webrtc-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Realtime Database
   - Copy your Firebase configuration
   - Update `public/config.js` with your Firebase config:

   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#003d82` - Main brand color for headers and primary actions
- **Secondary Blue**: `#0066cc` - Interactive elements and hover states  
- **Light Blue**: `#e6f2ff` - Background accents and highlights
- **Accent Blue**: `#4d94ff` - Active states and notifications
- **Pure White**: `#ffffff` - Main background and cards
- **Off White**: `#fafbfc` - Secondary backgrounds
- **Light Gray**: `#f5f7fa` - Borders and subtle backgrounds

### Typography
- **Font Family**: Inter (primary), system fonts (fallback)
- **Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Scale**: Responsive typography with fluid scaling

### Components
- **Border Radius**: 12px (standard), 20px (large elements)
- **Shadows**: Layered shadow system for depth
- **Animations**: Smooth transitions with cubic-bezier easing
- **Spacing**: 8px base unit with consistent scaling

## 📱 Responsive Breakpoints

- **Mobile**: ≤ 768px
- **Tablet**: 769px - 1024px  
- **Desktop**: ≥ 1025px

### Mobile Optimizations
- Collapsible chat panel
- Touch-friendly controls
- Optimized video layouts
- Simplified navigation

## 🔧 Configuration

### Access Codes
Access codes are 6-character alphanumeric strings that customers receive from their banking representatives. The system accepts any valid 6-character code for demonstration purposes.

### Agent Profiles
Agent information is configured in `script.js`:

```javascript
const agents = [
    {
        name: "Jessica Smith",
        title: "Senior Banking Specialist", 
        avatar: "JS",
        rating: 4.9,
        quote: "Helping customers achieve their financial goals since 2018"
    }
    // Add more agents as needed
];
```

### Session Settings
- **Video Quality**: 1280x720 @ 30fps (ideal)
- **Audio Quality**: High-definition audio
- **Connection Timeout**: 30 seconds
- **Session Duration**: Unlimited (until ended by participant)

## 🛠️ Development

### Project Structure
```
my-webrtc-app/
├── public/
│   ├── index.html          # Main HTML file
│   ├── script.js           # Core application logic
│   ├── ui-helpers.js       # UI utilities and helpers
│   ├── config.js           # Firebase configuration
│   └── assets/             # Static assets
├── package.json            # Dependencies and scripts
├── README.md              # This file
└── deploy.ps1             # Deployment script
```

### Key Files

#### `index.html`
- Complete UI structure
- CSS styling with custom properties
- Responsive design implementation
- Accessibility features

#### `script.js`
- WebRTC connection management
- Firebase integration
- Call state management
- Virtual background processing

#### `ui-helpers.js`
- Animation utilities
- Notification system
- Performance monitoring
- Accessibility helpers

### Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Deploy to Vercel
npm run deploy

# Run tests
npm test
```

## 🔒 Security Features

### Data Protection
- **End-to-End Encryption**: WebRTC provides encrypted peer-to-peer communication
- **Secure Signaling**: Firebase Realtime Database with security rules
- **Access Control**: Session-based access with unique codes
- **No Data Storage**: Video/audio streams are not stored on servers

### Privacy Compliance
- **GDPR Ready**: Minimal data collection with user consent
- **CCPA Compliant**: Transparent data usage policies
- **Banking Standards**: Designed for financial industry requirements
- **Audit Trail**: Session logging for compliance (when enabled)

## 🌐 Browser Support

### Supported Browsers
- **Chrome**: 80+ (recommended)
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### Required Features
- WebRTC support
- MediaDevices API
- Canvas API (for virtual backgrounds)
- ES6+ JavaScript support

## 📊 Performance

### Optimization Features
- **Lazy Loading**: Components loaded on demand
- **Efficient Rendering**: Optimized video processing
- **Memory Management**: Automatic cleanup of resources
- **Bandwidth Adaptation**: Quality adjustment based on connection

### Monitoring
- Connection quality indicators
- Performance metrics collection
- Error tracking and reporting
- User experience analytics

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Manual Deployment
1. Build the application
2. Upload `public/` folder to your web server
3. Configure HTTPS (required for WebRTC)
4. Set up Firebase security rules

### Environment Variables
```bash
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-domain
FIREBASE_DATABASE_URL=your-database-url
FIREBASE_PROJECT_ID=your-project-id
```

## 🤝 Contributing

### Development Guidelines
1. Follow the existing code style
2. Write descriptive commit messages
3. Test on multiple browsers and devices
4. Update documentation for new features
5. Ensure accessibility compliance

### Code Style
- Use ES6+ features
- Follow semantic naming conventions
- Comment complex logic
- Maintain consistent indentation
- Use meaningful variable names

## 📞 Support

### Technical Support
- **Documentation**: Comprehensive inline documentation
- **Error Handling**: Graceful error messages and recovery
- **Debugging**: Console logging for development
- **Help System**: Built-in help and guidance

### Customer Support
- **Help Button**: Accessible help system
- **Error Messages**: User-friendly error descriptions
- **Fallback Options**: Alternative connection methods
- **Contact Information**: Support phone numbers and resources

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Core video calling functionality
- Premium UI design
- Mobile responsive layout
- Basic virtual background support
- Secure chat integration

### Planned Features
- Advanced virtual backgrounds
- Call recording functionality
- Multi-language support
- Enhanced analytics
- Integration with banking systems
- Advanced security features

## 🏗️ Architecture

### Frontend Architecture
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility
- **Modular Design**: Separated concerns with dedicated files
- **Event-Driven**: Reactive UI updates based on application state
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Backend Architecture
- **Firebase Realtime Database**: Real-time signaling and session management
- **WebRTC**: Direct peer-to-peer communication
- **Serverless**: No dedicated backend servers required
- **Scalable**: Handles multiple concurrent sessions

### Data Flow
1. Customer enters access code
2. Firebase validates and creates session
3. WebRTC establishes peer connection
4. Real-time communication begins
5. Session cleanup on disconnect

---

**SecureBank Virtual Booth** - Connecting customers with their banking specialists through secure, professional video consultations.
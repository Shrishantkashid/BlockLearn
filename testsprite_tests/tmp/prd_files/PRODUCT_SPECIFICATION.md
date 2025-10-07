# BlockLearn - Peer-to-Peer Learning Platform

## Product Specification Document

### Version 1.0.0
### Date: October 5, 2025
### Prepared by: BlockLearn Development Team

---

## 1. Executive Summary

BlockLearn is a comprehensive peer-to-peer learning platform that connects students with mentors in a campus environment. The platform facilitates knowledge sharing, skill development, and academic collaboration through structured learning sessions, real-time communication, and blockchain-verified credentials.

### 1.1 Product Purpose

- **Primary Goal**: Democratize education by enabling peer-to-peer knowledge transfer within campus communities
- **Target Users**: College students and educators seeking skill development and mentorship opportunities
- **Core Value Proposition**: "Learn from peers, teach with impact, and build verified credentials"

### 1.2 Key Differentiators

- Blockchain-verified skill certifications
- AI-powered learning recommendations
- Multi-language support for diverse student populations
- Real-time collaboration tools
- Comprehensive feedback and rating systems

---

## 2. Product Overview

### 2.1 Platform Architecture

**Frontend**: React.js with Vite, Tailwind CSS, and modern UI components
**Backend**: Node.js with Express.js, PostgreSQL database
**Blockchain**: Solidity smart contracts for skill verification
**AI Integration**: OpenAI GPT-4 for intelligent assistance
**Real-time Features**: WebSocket-based chat and notifications

### 2.2 User Types

1. **Students**: Seek specific skills and knowledge
2. **Mentors**: Offer expertise and teaching services
3. **Administrators**: Platform oversight and moderation

---

## 3. Core Features

### 3.1 Authentication & User Management

#### 3.1.1 Campus Email Verification
- **Feature**: OTP-based email verification using campus domains
- **Supported Domains**: `saividya.ac.in`, `saividhya.ac.in`
- **Process**:
  1. User enters campus email
  2. System sends 6-digit OTP
  3. User verifies OTP to create account
- **Security**: Rate limiting (6 OTP requests per 15 minutes)

#### 3.1.2 Google OAuth Integration
- **Feature**: Social login using Google accounts
- **Process**:
  1. User authenticates with Google
  2. System verifies email domain
  3. Account created/updated automatically
- **Security**: JWT token-based sessions (7-day expiry)

#### 3.1.3 User Profiles
- **Personal Information**: Name, department, year of study
- **Bio & Availability**: Text description and time preferences
- **Profile Management**: Edit, view, and update capabilities

### 3.2 Skill Management System

#### 3.2.1 Skill Categories
- **Programming**: JavaScript, Python, React, Node.js
- **Data Science**: Machine Learning, Data Analysis
- **Web3**: Blockchain, Smart Contracts
- **Communication**: Public Speaking, Technical Writing
- **Academic**: Subject-specific tutoring

#### 3.2.2 Skill Types
- **Offered Skills**: Expertise available for teaching
- **Needed Skills**: Learning requirements
- **Proficiency Levels**: 1-5 scale rating system

#### 3.2.3 Skill Matching Algorithm
- **Criteria**: Location, availability, proficiency match
- **Recommendations**: AI-powered suggestions based on user profiles

### 3.3 Session Management

#### 3.3.1 Session Creation
- **Participants**: Student (learner) and Mentor (teacher)
- **Required Information**:
  - Skill to be taught/learned
  - Scheduled date and time
  - Duration (minutes)
  - Meeting location/link
  - Session notes
- **Status Tracking**: scheduled → in_progress → completed → cancelled

#### 3.3.2 Session Discovery
- **Browse**: Filter by skill, availability, rating
- **Search**: Text-based skill and mentor search
- **Recommendations**: Personalized suggestions

### 3.4 Real-Time Communication

#### 3.4.1 Chat System
- **Conversations**: Persistent chat threads
- **Message Types**: Text, with future support for file sharing
- **AI Assistant**: GPT-4 powered contextual responses
- **Message History**: Complete conversation logs

#### 3.4.2 Advanced AI Features
- **Contextual Responses**: Personalized assistance based on user profile
- **Learning Recommendations**: AI-suggested learning paths
- **External Resources**: Curated YouTube, Coursera, documentation links
- **Multi-language Support**: Translation capabilities

### 3.5 Feedback & Rating System

#### 3.5.1 Session Feedback
- **Rating Scale**: 1-5 stars for both participants
- **Feedback Types**: Positive, constructive, general
- **Comments**: Detailed written feedback
- **Mandatory**: Required for session completion

#### 3.5.2 Reputation System
- **Mentor Ratings**: Average rating from all sessions
- **Student Ratings**: Feedback quality and engagement scores
- **Leaderboard**: Top-rated mentors and active learners

### 3.6 Blockchain Integration

#### 3.6.1 Skill Verification
- **Smart Contracts**: Solidity-based verification system
- **Certificate Generation**: Blockchain-recorded credentials
- **Verification Process**:
  1. Session completion confirmed
  2. Blockchain transaction initiated
  3. Digital certificate generated
  4. Permanent record stored on-chain

#### 3.6.2 Certificate Management
- **Unique Transaction IDs**: Each certificate has unique blockchain record
- **Metadata**: Skill, date, participants, verification status
- **Portability**: Shareable across platforms

---

## 4. Technical Specifications

### 4.1 API Endpoints

#### Authentication (`/api/auth/`)
```
POST /login              - Traditional email/password login
POST /google             - Google OAuth authentication
POST /send-otp           - Send OTP to campus email
POST /verify-otp         - Verify OTP and create/login user
GET  /me                 - Get current user profile
GET  /allowed-domains    - List supported campus domains
GET  /google-config      - Check Google OAuth configuration
GET  /email-health       - Test email service status
```

#### Sessions (`/api/sessions/`)
```
GET  /                   - Get user's sessions (as student/mentor)
POST /                   - Create new learning session
GET  /:session_id        - Get specific session details
```

#### Chat (`/api/chat/`)
```
POST /conversation       - Create new conversation
POST /message            - Send message (AI-powered responses)
GET  /conversations      - Get user's conversations
GET  /conversation/:id   - Get specific conversation
PUT  /conversation/:id/close - Close conversation
GET  /analytics          - Get user learning analytics
```

#### Feedback (`/api/feedback/`)
```
POST /submit             - Submit session feedback
GET  /session/:id        - Get feedback for session
GET  /stats/:user_id     - Get user feedback statistics
GET  /leaderboard        - Get top-rated users
```

#### Blockchain (`/api/blockchain/`)
```
POST /verify             - Verify skill completion on blockchain
GET  /verify/:sessionId  - Get verification status
```

### 4.2 Database Schema

#### Core Tables
- **users**: User accounts and profile information
- **user_profiles**: Extended profile data (bio, avatar, etc.)
- **skills**: Available skills catalog
- **user_skills**: User-skill relationships (offered/needed)
- **sessions**: Learning session records
- **chat_conversations**: Chat thread management
- **chat_messages**: Individual messages with metadata
- **feedback_sessions**: Rating and feedback data
- **email_verifications**: OTP verification tracking

### 4.3 Security Requirements

#### Authentication Security
- JWT tokens with 7-day expiry
- Rate limiting on authentication endpoints
- Campus email domain validation
- Secure password storage (when implemented)

#### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection via helmet.js
- CORS configuration for cross-origin requests

---

## 5. User Experience Requirements

### 5.1 User Journey

#### New User Onboarding
1. **Email Verification**: Enter campus email → Receive OTP → Verify
2. **Profile Setup**: Complete profile with skills and preferences
3. **Skill Matching**: Browse available mentors or post skill needs
4. **First Session**: Schedule and complete initial learning session
5. **Feedback Loop**: Provide and receive feedback

#### Session Experience
1. **Discovery**: Find suitable mentors for desired skills
2. **Booking**: Schedule session with preferred time/location
3. **Preparation**: Access pre-session materials and guidelines
4. **Session**: Conduct learning session with real-time support
5. **Completion**: Submit feedback and receive blockchain certificate

### 5.2 Accessibility Requirements

- **Multi-language Support**: Primary languages for target campuses
- **Mobile Responsiveness**: Optimized for mobile learning
- **Screen Reader Compatibility**: WCAG 2.1 AA compliance
- **High Contrast Mode**: Support for visual impairments

---

## 6. Performance Requirements

### 6.1 Response Times
- **API Endpoints**: < 500ms for 95% of requests
- **Page Load Times**: < 2 seconds for main pages
- **Chat Messages**: < 100ms for real-time delivery
- **Search Results**: < 1 second for skill/mentor searches

### 6.2 Scalability Targets
- **Concurrent Users**: Support 10,000+ simultaneous users
- **Database Queries**: < 100ms average query time
- **File Storage**: Efficient handling of profile images and documents

---

## 7. Future Roadmap

### Phase 2 (v2.0)
- **Video Conferencing**: Integrated video calls for remote sessions
- **File Sharing**: Document and resource sharing during sessions
- **Progress Tracking**: Detailed learning analytics and progress reports
- **Mobile App**: Native iOS and Android applications

### Phase 3 (v3.0)
- **AI Tutor**: Personalized AI tutoring for complex subjects
- **VR Learning**: Immersive virtual reality learning environments
- **Global Expansion**: Multi-campus and international support
- **Enterprise Features**: Institutional partnerships and analytics

---

## 8. Success Metrics

### User Engagement
- **Daily Active Users**: 70% of registered users
- **Session Completion Rate**: > 85%
- **Average Sessions per User**: 3+ per month
- **User Retention**: > 60% month-over-month

### Learning Outcomes
- **Skill Acquisition Rate**: Users report 80%+ skill improvement
- **Mentor Effectiveness**: Average mentor rating > 4.5/5.0
- **Knowledge Transfer**: Successful peer-to-peer learning sessions

### Technical Performance
- **System Uptime**: 99.9% availability
- **Bug Reports**: < 1 per 1,000 sessions
- **Feature Adoption**: 90% of users utilize core features monthly

---

## 9. Compliance & Legal

### Data Privacy
- **GDPR Compliance**: European user data protection
- **FERPA Compliance**: Educational record privacy
- **Data Retention**: 7-year account and session history
- **User Consent**: Clear data usage and sharing policies

### Content Moderation
- **Community Guidelines**: Clear rules for appropriate conduct
- **Reporting System**: User-flagged content review process
- **Content Filtering**: Automated inappropriate content detection

---

*This Product Specification Document serves as the foundation for BlockLearn's development, testing, and future feature planning. All stakeholders should refer to this document for feature prioritization and technical decision-making.*

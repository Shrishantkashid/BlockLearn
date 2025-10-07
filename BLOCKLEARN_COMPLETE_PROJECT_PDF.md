# BlockLearn - Complete Project Documentation

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Technical Architecture](#technical-architecture)
4. [Installation & Setup](#installation--setup)
5. [Configuration Guide](#configuration-guide)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Frontend Structure](#frontend-structure)
9. [Backend Structure](#backend-structure)
10. [Smart Contracts](#smart-contracts)
11. [Security Implementation](#security-implementation)
12. [Deployment Guide](#deployment-guide)
13. [Troubleshooting](#troubleshooting)
14. [Development Roadmap](#development-roadmap)

---

## 🎯 Executive Summary

BlockLearn is a revolutionary peer-to-peer learning platform that combines blockchain technology, artificial intelligence, and modern web development to create a decentralized ecosystem for skill-sharing and knowledge exchange. The platform enables students and professionals to both learn new skills and monetize their expertise through tokenized rewards and blockchain-verified certifications.

### Key Features
- **🔐 Secure Authentication**: Email OTP + Google OAuth integration
- **🤖 AI-Powered Chat**: GPT-4 powered intelligent assistant with personalized recommendations
- **⛓️ Blockchain Integration**: ERC-20 BLT token and verifiable skill certificates
- **💎 Modern UI/UX**: Glassmorphism design with 3D animated backgrounds
- **📊 Advanced Analytics**: Comprehensive learning analytics and progress tracking

---

## 🌟 Project Overview

### Vision
To democratize education by creating a blockchain-powered platform where anyone can learn from peers, earn cryptocurrency for sharing knowledge, and build verifiable credentials for their skills and achievements.

### Mission
Connect learners with teachers in a trustless, decentralized environment where knowledge sharing is incentivized through cryptocurrency rewards and blockchain-verified certifications.

### Core Value Proposition
1. **Tokenized Incentives**: Earn cryptocurrency for learning and teaching
2. **Blockchain Verification**: Immutable, verifiable skill certificates
3. **AI-Powered Learning**: Personalized recommendations and assistance
4. **Decentralized Architecture**: Trustless, peer-to-peer knowledge exchange

---

## 🏗️ Technical Architecture

### Technology Stack

#### Frontend
- **React 19.1.1** - Modern React with latest features and hooks
- **Vite 7.1.5** - Fast build tool and development server
- **Three.js & React Three Fiber** - 3D graphics and animations
- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **TypeScript 5.9.2** - Type safety and enhanced developer experience
- **Web3 Integration** - ethers.js and web3.js for blockchain interaction
- **Google OAuth** - @react-oauth/google for social authentication

#### Backend
- **Node.js & Express 5.1.0** - Server-side JavaScript runtime
- **PostgreSQL 8.16.3** - Robust relational database
- **JWT Authentication** - jsonwebtoken for secure token-based auth
- **OpenAI GPT-4** - Advanced AI capabilities for chat system
- **Nodemailer 7.0.6** - Email services for OTP and notifications
- **Security** - helmet, cors, express-rate-limit for protection

#### Blockchain
- **Solidity Smart Contracts** - ERC-20 token and skill certification contracts
- **OpenZeppelin** - Secure contract templates and utilities
- **Hardhat** - Development and testing framework for smart contracts

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Git

### Quick Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd blocklearn-platform
```

#### 2. Install Dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

#### 3. Database Setup
```bash
# Create database
psql -U postgres
CREATE DATABASE skill_swap_db;
\q

# Run schema
psql -U postgres -d skill_swap_db -f backend/models/schema.sql
psql -U postgres -d skill_swap_db -f backend/models/add_indexes.sql
```

#### 4. Environment Configuration
```bash
# Backend configuration
cd backend
cp .env.example .env

# Edit .env with your values:
# - Database credentials
# - JWT secret
# - Email configuration
# - Google OAuth credentials
```

#### 5. Start Application
```bash
# From root directory
npm run dev
```

This starts:
- Backend on http://localhost:5000
- Frontend on http://localhost:5173

---

## ⚙️ Configuration Guide

### Backend Environment Variables

#### Database Configuration
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skill_swap_db
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

#### Security
```env
JWT_SECRET=your_generated_secret_key
NODE_ENV=development
```

#### Email Configuration
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
CAMPUS_EMAIL_DOMAINS=saividya.ac.in,saividhya.ac.in
```

#### Google OAuth
```env
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

#### Server Configuration
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables

#### Google OAuth
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### API Configuration
```env
VITE_API_URL=http://localhost:5000/api
```

### Email Setup (Gmail)
1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password from Google Account Settings
3. Use App Password in `EMAIL_PASS` environment variable

---

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    campus_verified BOOLEAN DEFAULT FALSE,
    profile_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Email Verification
```sql
CREATE TABLE email_verifications (
    email VARCHAR(255) PRIMARY KEY,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User Profiles
```sql
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(255),
    campus VARCHAR(100),
    year_of_study INTEGER,
    department VARCHAR(100),
    availability TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Skills Management
```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    skill_type VARCHAR(10) CHECK (skill_type IN ('offered', 'needed')),
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id, skill_type)
);
```

#### Sessions & Chat
```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    meeting_link TEXT,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('active', 'closed')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) CHECK (sender_type IN ('user', 'bot')),
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@campus.edu"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@campus.edu",
  "otp": "123456"
}
```

#### Google OAuth
```http
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google_jwt_token"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Chat Endpoints

#### Create Conversation
```http
POST /api/chat/conversation
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Learning React"
}
```

#### Send Message
```http
POST /api/chat/message
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "conversation_id": 123,
  "message": "How do I learn React?"
}
```

#### Get Conversations
```http
GET /api/chat/conversations
Authorization: Bearer <jwt_token>
```

### Health Check
```http
GET /api/health
```

Response:
```json
{
  "message": "BlockLearn API is running!"
}
```

---

## 🎨 Frontend Structure

### Key Components

#### App.jsx - Main Application Router
```jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Core Pages
import Index from "./pages/Index.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Skills from "./pages/Skills.jsx";
import Match from "./pages/Match.jsx";
import Sessions from "./pages/Sessions.jsx";

// Demo Pages
import Demo3DHero from "./pages/Demo3DHero.tsx";
import DemoBeams from "./pages/DemoBeams.tsx";

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/match" element={<Match />} />
        <Route path="/sessions" element={<Sessions />} />

        {/* Demo routes */}
        <Route path="/demo-3d" element={<Demo3DHero />} />
        <Route path="/demo-beams" element={<DemoBeams />} />
      </Routes>

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}
```

### Key Pages Structure
- **Index.jsx** - Landing page with 3D animations
- **Signup.jsx** - Two-step OTP registration
- **Login.jsx** - Google OAuth integration
- **Dashboard.jsx** - User dashboard with analytics
- **Skills.jsx** - Skills marketplace
- **Match.jsx** - Find mentors/students
- **Sessions.jsx** - Session management
- **ChatWidget.jsx** - AI-powered chat component

### UI Components
- **BeamsBlockLearn.jsx** - Custom 3D beam animations
- **HeroSection.jsx** - 3D animated hero sections
- **GlassmorphicNav.jsx** - Glassmorphism navigation
- **ShimmerButton.jsx** - Animated button effects

---

## 🔧 Backend Structure

### Server Configuration
#### server.js - Main Server File
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/feedback', require('./routes/feedback'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

### Route Structure

#### Authentication Routes (auth.js)
- **POST /send-otp** - Send verification OTP
- **POST /verify-otp** - Verify OTP and authenticate
- **POST /google** - Google OAuth authentication
- **GET /me** - Get current user profile

#### Chat Routes (chat.js)
- **POST /conversation** - Create new conversation
- **POST /message** - Send message and get AI response
- **GET /conversations** - Get user's conversations
- **GET /conversation/:id** - Get specific conversation

#### AI Integration Features
- **OpenAI GPT-4** integration for intelligent responses
- **User context awareness** for personalized assistance
- **Multi-language support** with translation capabilities
- **Conversation history** for context retention

---

## ⛓️ Smart Contracts

### BlockLearnToken.sol - ERC-20 Token Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlockLearnToken is ERC20, Ownable {
    // Token economics
    uint256 public constant MAX_SUPPLY = 100000000 * 10**18; // 100 million tokens
    uint256 public constant SKILL_COMPLETION_REWARD = 10 * 10**18; // 10 tokens per skill
    uint256 public constant TEACHING_REWARD = 5 * 10**18; // 5 tokens for teaching
    uint256 public constant MILESTONE_BONUS = 50 * 10**18; // 50 tokens for milestones

    // Events
    event TokensAwarded(address indexed recipient, uint256 amount, string reason);
    event SkillCompleted(address indexed user, string skillName);

    constructor() ERC20("BlockLearn Token", "BLT") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY / 10); // 10% for initial distribution
    }

    function awardSkillCompletion(address recipient, string memory skillName) external onlyOwner {
        _transfer(owner(), recipient, SKILL_COMPLETION_REWARD);
        emit TokensAwarded(recipient, SKILL_COMPLETION_REWARD, "Skill completion");
        emit SkillCompleted(recipient, skillName);
    }
}
```

### SkillSwapContract.sol - Skill Certification Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SkillSwapContract is Ownable {
    using Counters for Counters.Counter;

    struct SkillCertificate {
        uint256 id;
        address student;
        string skillName;
        string issuerName;
        uint256 issuedAt;
        string metadata;
        bool isValid;
        address issuedBy;
    }

    mapping(address => SkillCertificate[]) public userCertificates;
    mapping(address => mapping(string => bool)) public certificateExists;
    mapping(address => uint256) public userReputation;

    event SkillCertificateIssued(address indexed student, string skillName, string issuerName, uint256 certificateId);

    function issueCertificate(
        address student,
        string memory skillName,
        string memory issuerName,
        string memory metadata
    ) external returns (uint256) {
        require(!certificateExists[student][skillName], "Certificate already exists");

        _certificateIds.increment();
        uint256 certificateId = _certificateIds.current();

        SkillCertificate memory newCertificate = SkillCertificate({
            id: certificateId,
            student: student,
            skillName: skillName,
            issuerName: issuerName,
            issuedAt: block.timestamp,
            metadata: metadata,
            isValid: true,
            issuedBy: msg.sender
        });

        userCertificates[student].push(newCertificate);
        certificateExists[student][skillName] = true;
        userReputation[student] += 10;

        emit SkillCertificateIssued(student, skillName, issuerName, certificateId);
        return certificateId;
    }
}
```

---

## 🔐 Security Implementation

### Authentication Security
- **JWT Tokens** with secure secret generation
- **Rate Limiting** on all authentication endpoints
- **Email Verification** for account creation
- **Password Hashing** using bcryptjs
- **CORS Protection** with strict origin policies

### API Security
- **Helmet.js** for security headers
- **Input Validation** on all endpoints
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** through data sanitization

### Smart Contract Security
- **OpenZeppelin Standards** for secure contract development
- **Access Control** with Ownable pattern
- **Reentrancy Protection** in token transfers
- **Gas Limit Management** for transaction efficiency

---

## 🚀 Deployment Guide

### Development Deployment
```bash
# Start both servers
npm run dev

# Or individually
npm run server  # Backend
npm run client  # Frontend
```

### Production Deployment

#### Environment Setup
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_SSL=true
JWT_SECRET=your_production_secret
```

#### Database Migration
```bash
# Run production schema
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -f backend/models/schema.sql
```

#### Process Management
```bash
# Using PM2 for production
pm2 start backend/server.js --name "blocklearn-backend"
pm2 start "npm run preview" --name "blocklearn-frontend" --cwd frontend
```

#### SSL/TLS Setup
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l | grep skill_swap_db

# Test connection
psql -U postgres -d skill_swap_db -c "SELECT 1;"
```

#### Email Configuration Issues
```bash
# Test email configuration
cd backend && node testEmail.js

# Check Gmail app password
# Verify 2FA is enabled on Gmail
# Regenerate app password if needed
```

#### Frontend Connection Issues
```bash
# Check backend health
curl http://localhost:5000/api/health

# Verify CORS configuration
curl -H "Origin: http://localhost:5173" http://localhost:5000/api/health

# Check frontend console for errors
# Verify VITE_API_URL configuration
```

#### Smart Contract Issues
```bash
# Check contract deployment
npx hardhat run scripts/deploy-token.js --network localhost

# Verify token balance
npx hardhat console
# token = await ethers.getContract("BlockLearnToken")
# balance = await token.balanceOf(userAddress)
```

---

## 🗺️ Development Roadmap

### Phase 1: MVP (Current) ✅
- [x] User authentication system
- [x] Basic skill management
- [x] Session scheduling
- [x] AI chat integration
- [x] Smart contract deployment
- [x] Modern UI with 3D animations

### Phase 2: Enhanced Features (Next 3 months)
- [ ] Mobile application development
- [ ] Video calling integration
- [ ] Advanced blockchain features
- [ ] Multi-language support
- [ ] Enhanced AI capabilities

### Phase 3: Scaling (6-12 months)
- [ ] Institutional partnerships
- [ ] Advanced tokenomics
- [ ] Cross-platform blockchain
- [ ] Enterprise features
- [ ] Global market expansion

---

## 📚 Additional Resources

### Documentation Files
- **SETUP_INSTRUCTIONS.md** - Complete setup guide
- **QUICK_START.md** - Quick configuration guide
- **GOOGLE_OAUTH_SETUP.md** - OAuth configuration
- **IMPLEMENTATION_SUMMARY.md** - Feature overview
- **BLOCKLEARN_PRD.md** - Product requirements document

### Configuration Files
- **backend/.env.example** - Backend environment template
- **frontend/.env.example** - Frontend environment template
- **hardhat.config.js** - Blockchain development config
- **package.json** - Dependencies and scripts

### Database Files
- **backend/models/schema.sql** - Complete database schema
- **backend/models/add_indexes.sql** - Performance indexes
- **backend/models/cleanup_expired_otps.sql** - Maintenance scripts

---

## 🤝 Support & Contributing

### Getting Help
1. Check existing documentation
2. Review troubleshooting section
3. Check backend/frontend logs
4. Verify environment configuration
5. Test with provided test scripts

### Development Guidelines
- Follow existing code style and patterns
- Write tests for new features
- Update documentation for changes
- Use meaningful commit messages
- Review security implications

---

## 📞 Contact Information

**Project**: BlockLearn - Blockchain-Powered Learning Platform
**Version**: 1.0.0
**Last Updated**: 2025-10-05
**Status**: Active Development

---

*This comprehensive documentation covers all aspects of the BlockLearn project including setup, configuration, development, deployment, and troubleshooting. Use this as your complete reference guide for understanding and working with the platform.*

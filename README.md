# BlockLearn

A decentralized peer-to-peer skill exchange platform combining web3 and real-time communication.

## Overview

BlockLearn is a innovative platform that connects learners with mentors for skill exchanges using blockchain technology for verification and reputation management. The platform features real-time video calling, chat functionality, and a smart matching algorithm to connect users with complementary skills.

## Features

- **User Authentication**: Email OTP and Google OAuth
- **Skill Matching**: Algorithmic matching of users for skill exchange
- **Real-time Communication**: Chat and WebRTC video calling
- **Blockchain Integration**: Skill completion tracking and reputation management
- **Feedback System**: Post-session ratings and reviews
- **Admin Panel**: User management and moderation tools

## Technologies Used

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Socket.IO client for real-time communication
- WebRTC for video calling
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB for database
- Socket.IO for real-time communication
- WebRTC with PeerJS for video calling
- JSON Web Tokens (JWT) for authentication

### Blockchain
- Solidity smart contracts
- Hardhat for deployment and testing

## Project Structure

```
.
├── backend/          # Backend API and server
├── frontend/         # Frontend React application
├── contracts/        # Solidity smart contracts
├── scripts/          # Deployment scripts
└── testsprite_tests/ # Automated tests
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blocklearn
```

2. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Install root dependencies:
```bash
npm install
```

### Environment Setup

1. Create a `.env` file in the `backend` directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email_for_notifications
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:5173
```

2. Create a `.env` file in the `frontend` directory with the following variables:
```
VITE_API_URL=http://localhost:5000
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

This will start both the backend and frontend servers concurrently.

Alternatively, you can start them separately:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Deployment

### Vercel Deployment

The project is configured for deployment to Vercel. See the individual README files in the `frontend` and `backend` directories for detailed deployment instructions.

### Environment Variables for Production

Make sure to set the following environment variables in your production environment:

Backend:
- `MONGODB_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `FRONTEND_URL`

Frontend:
- `VITE_API_URL`

## Testing

Run automated tests:
```bash
npm test
```

## Smart Contracts

Deploy smart contracts:
```bash
npx hardhat run scripts/deploy-skillswap.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
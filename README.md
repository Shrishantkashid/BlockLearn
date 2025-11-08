# BlockLearn - Decentralized Skill Exchange Platform

A decentralized peer-to-peer skill exchange platform combining web3 and real-time communication.
BlockLearn is a innovative platform that connects learners with mentors for skill exchanges using blockchain technology for verification and reputation management. The platform features real-time video calling, chat functionality, and a smart matching algorithm to connect users with complementary skills.

## Features

- **User Authentication**: Email OTP and Google OAuth
- **Skill Matching**: Algorithmic matching of users for skill exchange
- **Real-time Communication**: Chat and WebRTC video calling
- **Blockchain Integration**: Skill completion tracking and reputation management
- **Feedback System**: Post-session ratings and reviews
- **Admin Panel**: User management and moderation tools
- **Mentor-Admin Video Calling**: Secure video conferencing between mentors and administrators

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

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Set up environment variables (see `.env.example` files)

5. Start the development servers:
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory
   npm run dev
   ```

## Project Structure

```
.
├── backend/          # Backend API and Socket.IO server
├── frontend/         # React frontend application
├── contracts/        # Solidity smart contracts
├── scripts/          # Deployment and utility scripts
└── tests/            # Test files
```

## Key Features Implementation

### User Authentication
- Email/Password registration with OTP verification
- Google OAuth integration
- JWT-based session management

### Skill Matching
- Algorithmic matching based on user skills and interests
- Real-time matching updates
- Profile-based recommendations

### Real-time Communication
- Socket.IO for chat functionality
- WebRTC for peer-to-peer video calling
- Multi-user video conferencing support

### Blockchain Integration
- Skill completion verification using smart contracts
- Reputation system with token rewards
- Certificate issuance and verification

### Admin Panel
- User management dashboard
- Session monitoring
- Content moderation tools

### Mentor-Admin Video Calling
- Secure peer-to-peer video conferencing
- Role-based access control
- Session code sharing for easy connection
- Real-time chat during calls

## Development Guidelines

### Code Style
- Follow Airbnb JavaScript style guide
- Use Tailwind CSS for styling
- Component-based architecture

### Testing
- Unit tests with Jest
- Integration tests for API endpoints
- End-to-end tests with Cypress

### Deployment
- Vercel for frontend deployment
- Heroku or similar for backend deployment
- MongoDB Atlas for database hosting

## API Documentation

See `API_DOCS.md` for detailed API endpoint documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Support

For support, please open an issue on the GitHub repository or contact the development team.
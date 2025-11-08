# BlockLearn Backend

This is the backend for the BlockLearn application, a decentralized peer-to-peer skill exchange platform.

## Technologies Used
- Node.js with Express
- MongoDB for database
- Socket.IO for real-time communication
- WebRTC for video calling
- JSON Web Tokens (JWT) for authentication

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example` and fill in the required values

3. Start the development server:
```bash
npm run dev
```

## Deployment to Vercel

### Prerequisites
1. A Vercel account
2. MongoDB database (MongoDB Atlas recommended)
3. Environment variables configured in Vercel

### Deployment Steps

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Log in to your Vercel account and create a new project

3. Import your Git repository

4. Configure the project settings:
   - Framework Preset: Other
   - Root Directory: backend
   - Build Command: `npm install`
   - Output Directory: ./

5. Add the following environment variables in Vercel:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email_for_notifications
   EMAIL_PASS=your_email_password
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

6. Deploy the project

### Environment Variables
The following environment variables need to be set in Vercel:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `EMAIL_USER`: Email address for sending notifications
- `EMAIL_PASS`: Password for the email account
- `FRONTEND_URL`: The URL of your frontend application
- `PORT`: Port for the server (default: 5000)

## Development Commands

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## Project Structure
```
backend/
├── config/         # Configuration files
├── middleware/     # Express middleware
├── models/         # Database models and schemas
├── routes/         # API route handlers
├── utils/          # Utility functions and helpers
├── server.js       # Main server file
└── package.json    # Project dependencies and scripts
```

## API Endpoints
- `/api/auth` - Authentication endpoints
- `/api/skills` - Skill management endpoints
- `/api/sessions` - Session management endpoints
- `/api/matching` - Matching algorithm endpoints
- `/api/chat` - Chat functionality endpoints
- `/api/feedback` - Feedback collection endpoints
- `/api/admin` - Admin panel endpoints
- `/api/blockchain` - Blockchain integration endpoints

## Real-time Features
- Socket.IO for signaling in WebRTC connections
- PeerJS for simplified WebRTC implementation
- Real-time chat functionality
- Live session notifications
# BlockLearn Frontend

This is the frontend for the BlockLearn application, a decentralized peer-to-peer skill exchange platform.

## Technologies Used
- React 18 with Vite
- Tailwind CSS for styling
- Socket.IO for real-time communication
- WebRTC for video calling
- React Router for navigation

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
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: dist

5. Add the following environment variables in Vercel:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```

6. Deploy the project

### Environment Variables
The following environment variables need to be set in Vercel:
- `VITE_API_URL`: The URL of your backend API (e.g., https://your-backend-url.vercel.app)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── routes/         # API route handlers
├── services/       # Business logic and API services
├── lib/            # Utility functions and helpers
├── providers/      # React context providers
├── App.jsx         # Main application component
├── main.jsx        # Application entry point
└── config.js       # Configuration file
```
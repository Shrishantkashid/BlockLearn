# BlockLearn Deployment Guide

This guide provides step-by-step instructions for deploying the BlockLearn application to Vercel.

## Prerequisites

1. A GitHub/GitLab/Bitbucket account
2. A Vercel account
3. MongoDB Atlas account (or any MongoDB hosting service)
4. Domain name (optional, for custom domain setup)

## Architecture Overview

BlockLearn is a monorepo application with:
- Frontend: React + Vite application
- Backend: Node.js + Express API with Socket.IO and PeerJS

## Deployment Steps

### 1. Prepare Your Repository

1. Ensure your code is pushed to a Git repository
2. Make sure the repository structure matches:
```
.
├── backend/
├── frontend/
├── contracts/
├── scripts/
└── vercel.json
```

### 2. Set Up MongoDB

1. Create a MongoDB Atlas cluster or use any MongoDB hosting service
2. Whitelist Vercel's IP addresses in your MongoDB Atlas network access settings:
   - 0.0.0.0/0 (for development/testing)
   - Or specific Vercel IPs (check Vercel documentation for current IPs)

### 3. Deploy Backend to Vercel

1. Log in to your Vercel account
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - Project Name: blocklearn-backend (or your preferred name)
   - Framework Preset: Other
   - Root Directory: backend
   - Build Command: `npm install`
   - Output Directory: ./
5. Add Environment Variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   FRONTEND_URL=https://your-frontend-url.vercel.app
   PORT=5000
   PEER_PORT=5001
   ```
6. Click "Deploy"

### 4. Deploy Frontend to Vercel

1. In Vercel, click "New Project"
2. Import the same Git repository
3. Configure the project:
   - Project Name: blocklearn-frontend (or your preferred name)
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: dist
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```
5. Click "Deploy"

### 5. Configure Environment Variables

#### Backend Environment Variables:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret key for JWT token generation
- `EMAIL_USER`: Email address for sending notifications
- `EMAIL_PASS`: Password or app-specific password for the email account
- `FRONTEND_URL`: The URL of your frontend deployment
- `PORT`: Server port (default: 5000)
- `PEER_PORT`: PeerJS server port (default: 5001)
- `GOOGLE_CLIENT_ID`: (Optional) Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: (Optional) Google OAuth client secret

#### Frontend Environment Variables:
- `VITE_API_URL`: The URL of your backend deployment

### 6. Configure Custom Domains (Optional)

1. In your Vercel dashboard, go to your project settings
2. Navigate to the "Domains" section
3. Add your custom domain
4. Follow the DNS configuration instructions provided by Vercel

### 7. Set Up Environment Variables for Production

After deploying both frontend and backend, update the environment variables to use the actual deployment URLs:

1. Update `FRONTEND_URL` in the backend to point to your frontend deployment
2. Update `VITE_API_URL` in the frontend to point to your backend deployment

### 8. Enable WebSocket Support

Vercel automatically supports WebSocket connections, but ensure your Socket.IO configuration is correct:

1. In your frontend LiveSession component, make sure the Socket.IO connection uses the correct URL
2. In your backend signaling.js, ensure CORS is properly configured

## Troubleshooting

### Common Issues:

1. **CORS Errors**: 
   - Ensure `FRONTEND_URL` environment variable is set correctly in the backend
   - Check that CORS origins include your frontend URL

2. **WebSocket Connection Issues**:
   - Verify that Socket.IO is configured with `transports: ['websocket']`
   - Check that the frontend is connecting to the correct backend URL

3. **MongoDB Connection Failures**:
   - Verify your `MONGODB_URI` is correct
   - Ensure MongoDB Atlas IP whitelist includes Vercel IPs
   - Check that your MongoDB credentials are correct

4. **Environment Variables Not Loading**:
   - Ensure environment variables are set in Vercel project settings
   - Check that variable names match exactly (case-sensitive)

### Logs and Monitoring

1. Use Vercel's log viewer to check for errors:
   - Go to your project in Vercel dashboard
   - Click on "Logs" tab
   - Check both build logs and function logs

2. Add console.log statements in your code for debugging
3. Use Vercel's analytics for performance monitoring

## Scaling Considerations

1. **Database**: 
   - Use MongoDB Atlas tier appropriate for your expected traffic
   - Enable database indexing for frequently queried fields

2. **WebSocket Connections**:
   - Vercel has limits on concurrent WebSocket connections
   - Consider using a dedicated WebSocket service for high-traffic applications

3. **Bandwidth**:
   - Video calls consume significant bandwidth
   - Monitor usage and upgrade Vercel plan if necessary

## Updates and Redeployment

1. Push changes to your Git repository
2. Vercel will automatically trigger a new deployment
3. For environment variable changes:
   - Update variables in Vercel project settings
   - Redeploy the affected service

## Security Considerations

1. **Environment Variables**:
   - Never commit sensitive information to Git
   - Use Vercel's environment variable management

2. **JWT Secrets**:
   - Use strong, random secrets
   - Rotate secrets periodically

3. **MongoDB**:
   - Use strong authentication
   - Limit database user permissions
   - Enable encryption at rest if available

4. **Email**:
   - Use app-specific passwords rather than account passwords
   - Consider using email services like SendGrid for production

## Support

For issues with deployment:
1. Check Vercel documentation
2. Review application logs
3. Ensure all environment variables are correctly set
4. Verify repository structure matches expected format
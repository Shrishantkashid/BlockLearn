# BlockLearn Backend Setup Instructions

## 1. MongoDB Atlas Configuration

1. Sign up for MongoDB Atlas at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Add a database user:
   - Go to Database Access in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" as the authentication method
   - Enter a username and password
   - Grant "Read and write to any database" permissions
4. Configure network access:
   - Go to Network Access in the left sidebar
   - Click "Add IP Address"
   - For development, you can add your current IP or allow access from anywhere (0.0.0.0/0)
5. Get your connection string:
   - Go to Clusters in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
6. Update your [.env](file:///C:/Users/Admin/OneDrive/Desktop/mini%20project%202/Mini-project/backend/.env) file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blocklearn?retryWrites=true&w=majority
   ```

## 2. Email Configuration (Gmail SMTP)

1. Enable 2-factor authentication on your Google account:
   - Go to https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)" - name it "BlockLearn"
   - Copy the generated 16-character password

3. Update your [.env](file:///C:/Users/Admin/OneDrive/Desktop/mini%20project%202/Mini-project/backend/.env) file:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=the_16_character_app_password
   EMAIL_SERVICE=gmail
   ```

## 3. JWT Secret

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update your [.env](file:///C:/Users/Admin/OneDrive/Desktop/mini%20project%202/Mini-project/backend/.env) file:
```
JWT_SECRET=your_generated_secret_here
```

## 4. Google OAuth (Optional)

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Authorized JavaScript origins: http://localhost:5173
   - Authorized redirect URIs: http://localhost:5173
5. Update your [.env](file:///C:/Users/Admin/OneDrive/Desktop/mini%20project%202/Mini-project/backend/.env) file:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```

## 5. Testing the Setup

1. Start the backend server:
   ```bash
   npm start
   ```

2. Test email functionality:
   ```bash
   node test-email-send.js
   ```

3. Test OTP functionality:
   ```bash
   node test-otp.js
   ```

## 6. Common Issues and Solutions

### Email Issues
- **"Username and Password not accepted"**: Make sure you're using an App Password, not your regular Gmail password
- **"Invalid login"**: Check that EMAIL_USER is your full Gmail address

### MongoDB Issues
- **"Authentication failed"**: Check your username and password in the connection string
- **"Network error"**: Make sure your IP is whitelisted in MongoDB Atlas
- **"DNS resolution failed"**: Try changing your DNS to Google DNS (8.8.8.8) - see MONGODB_ATLAS_FIX_GUIDE.md for details

### OTP Issues
- **"Failed to send OTP"**: Check that email configuration is correct
- **"Invalid or expired OTP"**: OTPs expire after 10 minutes

## 7. MongoDB Connection Troubleshooting

If you're having issues connecting to MongoDB Atlas, see the detailed guide:
- [MONGODB_ATLAS_FIX_GUIDE.md](file:///C:/Users/shank/OneDrive/Desktop/Mini%20Project/Blocklearn/MONGODB_ATLAS_FIX_GUIDE.md) - Comprehensive troubleshooting guide
- [CHANGE_DNS_WINDOWS.md](file:///C:/Users/shank/OneDrive/Desktop/Mini%20Project/Blocklearn/CHANGE_DNS_WINDOWS.md) - How to change DNS settings on Windows

The application will work in mock mode if MongoDB connection fails, but some features will be limited.
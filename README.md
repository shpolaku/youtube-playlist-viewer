# YouTube Playlist Viewer

A simple web application that authenticates with Google and displays your YouTube playlists with all their videos.

![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google%20OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)

## Features

- 🔐 Google OAuth 2.0 authentication
- 📋 Display all your YouTube playlists
- 🎥 View videos in each playlist
- 🎨 Modern, YouTube-inspired UI
- 📱 Responsive design

## Prerequisites

- Node.js (v14 or higher)
- A Google account with YouTube
- Google Cloud Project with YouTube Data API enabled

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services > Library**
4. Search for and enable **YouTube Data API v3**

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in app name and your email
   - Add your email to test users
4. For Application type, select **Web application**
5. Add **Authorized redirect URIs**: `http://localhost:3000/callback`
6. Click **Create**
7. Note your **Client ID** and **Client Secret**

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your Google credentials:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
PORT=3000
REDIRECT_URI=http://localhost:3000/callback
```

### 5. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Click "Login with Google"
3. Authorize the application via Google
4. View your YouTube playlists!
5. Click on any playlist to see its videos

## Project Structure

```
spotify2youtube/
├── server.js           # Express server with Google OAuth endpoints
├── package.json        # Node.js dependencies
├── .env               # Environment variables (not in git)
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore file
├── public/            # Frontend assets
│   ├── index.html    # Main HTML page
│   ├── app.js        # Frontend JavaScript
│   └── styles.css    # Styling
└── README.md          # This file
```

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **API**: YouTube Data API v3
- **Authentication**: Google OAuth 2.0

## API Scopes

The application requests the following Google scope:
- `https://www.googleapis.com/auth/youtube.readonly` - Read-only access to your YouTube account

## Troubleshooting

### "Authentication failed" error
- Verify your Client ID and Client Secret are correct in `.env`
- Ensure the Redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/callback`
- Make sure YouTube Data API v3 is enabled in your Google Cloud project

### "Failed to load playlists"
- Check that you've authorized the correct scope
- Verify your access token is valid
- Check the browser console for error messages
- Make sure you have at least one playlist in your YouTube account

### Port already in use
- Change the `PORT` value in your `.env` file
- Update the Redirect URI in both `.env` and Google Cloud Console

### OAuth consent screen issues
- Make sure you've added yourself to the test users list
- If using "External" user type in testing mode, only added test users can log in
- You can publish the app or add more test users in the OAuth consent screen settings

## API Quota Limits

YouTube Data API v3 has a default quota of **10,000 units per day**. This application uses:
- **1 unit** per playlist list request
- **1 unit** per playlist items request

Normal usage should stay well within limits.

## License

MIT

## Contributing

Feel free to open issues or submit pull requests!

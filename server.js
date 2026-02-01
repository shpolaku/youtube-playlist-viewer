require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Google OAuth configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

// Serve static files from 'public' directory
app.use(express.static('public'));

// Login endpoint - initiates Google authorization
app.get('/login', (req, res) => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(SCOPE)}&` +
        `access_type=offline&` +
        `prompt=consent`;

    res.redirect(authUrl);
});

// Callback endpoint - handles OAuth callback and token exchange
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
                code: code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Redirect to frontend with access token
        res.redirect(`/?access_token=${accessToken}`);
    } catch (error) {
        console.error('Error exchanging code for token:', error.response?.data || error.message);
        res.redirect('/?error=auth_failed');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`YouTube Playlist Viewer running on http://localhost:${PORT}`);
    console.log(`Make sure to set your Google OAuth Redirect URI to: ${REDIRECT_URI}`);
});

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
const SCOPE = 'https://www.googleapis.com/auth/youtube';

// Serve static files from 'public' directory
app.use(express.static('public'));

// Explicit root route to serve index.html (needed for Vercel)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


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

// Body parser for JSON
app.use(express.json());

// API endpoint to create a new playlist
app.post('/api/create-playlist', async (req, res) => {
    const { accessToken, name, description } = req.body;

    if (!accessToken || !name) {
        return res.status(400).json({ error: 'Missing required fields: accessToken and name' });
    }

    try {
        const response = await axios.post(
            'https://www.googleapis.com/youtube/v3/playlists',
            {
                snippet: {
                    title: name,
                    description: description || ''
                },
                status: {
                    privacyStatus: 'private'
                }
            },
            {
                params: {
                    part: 'snippet,status',
                    access_token: accessToken
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const playlistId = response.data.id;
        res.json({
            playlistId,
            url: `https://music.youtube.com/playlist?list=${playlistId}`
        });
    } catch (error) {
        console.error('Error creating playlist:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create playlist' });
    }
});

// API endpoint to add videos to a playlist
app.post('/api/add-to-playlist', async (req, res) => {
    const { accessToken, playlistId, videoIds } = req.body;

    if (!accessToken || !playlistId || !videoIds || !Array.isArray(videoIds)) {
        return res.status(400).json({ error: 'Missing required fields: accessToken, playlistId, and videoIds array' });
    }

    const results = {
        added: 0,
        failed: []
    };

    for (const videoId of videoIds) {
        try {
            await axios.post(
                'https://www.googleapis.com/youtube/v3/playlistItems',
                {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: videoId
                        }
                    }
                },
                {
                    params: {
                        part: 'snippet',
                        access_token: accessToken
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            results.added++;
        } catch (error) {
            console.error(`Failed to add video ${videoId}:`, error.response?.data || error.message);
            results.failed.push({ videoId, error: error.response?.data?.error?.message || 'Unknown error' });
        }
    }

    res.json(results);
});

// Start server
app.listen(PORT, () => {
    console.log(`YouTube Playlist Viewer running on http://localhost:${PORT}`);
    console.log(`Make sure to set your Google OAuth Redirect URI to: ${REDIRECT_URI}`);
});

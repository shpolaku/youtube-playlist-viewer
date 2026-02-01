// YouTube API Base URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// DOM Elements
const loginSection = document.getElementById('login-section');
const loadingSection = document.getElementById('loading-section');
const errorSection = document.getElementById('error-section');
const playlistsSection = document.getElementById('playlists-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const retryBtn = document.getElementById('retry-btn');
const playlistsContainer = document.getElementById('playlists-container');
const errorMessage = document.getElementById('error-message');

let accessToken = null;

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    // Check for access token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    const error = params.get('error');

    if (error) {
        showError('Authentication failed. Please try again.');
        return;
    }

    if (token) {
        accessToken = token;
        // Clean URL
        window.history.replaceState({}, document.title, '/');
        loadPlaylists();
    } else {
        showSection(loginSection);
    }

    // Event listeners
    loginBtn.addEventListener('click', () => {
        window.location.href = '/login';
    });

    logoutBtn.addEventListener('click', logout);
    retryBtn.addEventListener('click', () => {
        if (accessToken) {
            loadPlaylists();
        } else {
            showSection(loginSection);
        }
    });
});

// Show specific section
function showSection(section) {
    [loginSection, loadingSection, errorSection, playlistsSection].forEach(s => {
        s.classList.add('hidden');
    });
    section.classList.remove('hidden');
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    showSection(errorSection);
}

// Logout
function logout() {
    accessToken = null;
    playlistsContainer.innerHTML = '';
    showSection(loginSection);
}

// Load playlists
async function loadPlaylists() {
    showSection(loadingSection);

    try {
        // Fetch user's playlists
        const playlistsData = await fetchYouTubeAPI('/playlists', {
            part: 'snippet,contentDetails',
            mine: true,
            maxResults: 50
        });

        if (!playlistsData.items || playlistsData.items.length === 0) {
            showError('No playlists found in your account.');
            return;
        }

        // Display playlists
        displayPlaylists(playlistsData.items);
        showSection(playlistsSection);
    } catch (error) {
        console.error('Error loading playlists:', error);
        showError('Failed to load playlists. Please try again.');
    }
}

// Fetch from YouTube API
async function fetchYouTubeAPI(endpoint, params = {}) {
    const queryParams = new URLSearchParams({
        ...params,
        access_token: accessToken
    });

    const response = await fetch(`${YOUTUBE_API_BASE}${endpoint}?${queryParams}`);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
}

// Display playlists
function displayPlaylists(playlists) {
    playlistsContainer.innerHTML = '';

    playlists.forEach(playlist => {
        const playlistCard = createPlaylistCard(playlist);
        playlistsContainer.appendChild(playlistCard);
    });
}

// Create playlist card
function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';

    const header = document.createElement('div');
    header.className = 'playlist-header';
    header.onclick = () => togglePlaylistVideos(card, playlist.id);

    const image = document.createElement('img');
    image.src = playlist.snippet.thumbnails?.medium?.url || 'https://via.placeholder.com/180x100';
    image.alt = playlist.snippet.title;
    image.className = 'playlist-image';

    const info = document.createElement('div');
    info.className = 'playlist-info';

    const name = document.createElement('h3');
    name.textContent = playlist.snippet.title;

    const details = document.createElement('p');
    const videoCount = playlist.contentDetails.itemCount;
    details.textContent = `${videoCount} video${videoCount !== 1 ? 's' : ''}`;

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '▼';

    info.appendChild(name);
    info.appendChild(details);
    header.appendChild(image);
    header.appendChild(info);
    header.appendChild(arrow);

    const videosContainer = document.createElement('div');
    videosContainer.className = 'tracks-container hidden';
    videosContainer.id = `videos-${playlist.id}`;

    card.appendChild(header);
    card.appendChild(videosContainer);

    return card;
}

// Toggle playlist videos
async function togglePlaylistVideos(card, playlistId) {
    const videosContainer = card.querySelector(`#videos-${playlistId}`);
    const arrow = card.querySelector('.arrow');

    if (!videosContainer.classList.contains('hidden')) {
        // Collapse
        videosContainer.classList.add('hidden');
        arrow.textContent = '▼';
        return;
    }

    // Expand - check if videos already loaded
    if (videosContainer.children.length === 0) {
        // Load videos
        try {
            videosContainer.innerHTML = '<p class="loading-tracks">Loading videos...</p>';
            videosContainer.classList.remove('hidden');
            arrow.textContent = '▲';

            const videosData = await fetchYouTubeAPI('/playlistItems', {
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 50
            });

            displayVideos(videosContainer, videosData.items);
        } catch (error) {
            console.error('Error loading videos:', error);
            videosContainer.innerHTML = '<p class="error-tracks">Failed to load videos</p>';
        }
    } else {
        // Just expand
        videosContainer.classList.remove('hidden');
        arrow.textContent = '▲';
    }
}

// Display videos
function displayVideos(container, videoItems) {
    container.innerHTML = '';

    if (!videoItems || videoItems.length === 0) {
        container.innerHTML = '<p class="no-tracks">No videos in this playlist</p>';
        return;
    }

    const videosList = document.createElement('ul');
    videosList.className = 'tracks-list';

    videoItems.forEach((item, index) => {
        if (!item.snippet) return;

        const li = document.createElement('li');

        const videoNumber = document.createElement('span');
        videoNumber.className = 'track-number';
        videoNumber.textContent = `${index + 1}.`;

        const videoInfo = document.createElement('div');
        videoInfo.className = 'track-info';

        const videoTitle = document.createElement('span');
        videoTitle.className = 'track-name';
        videoTitle.textContent = item.snippet.title;

        const channelName = document.createElement('span');
        channelName.className = 'track-artist';
        channelName.textContent = item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle;

        videoInfo.appendChild(videoTitle);
        videoInfo.appendChild(channelName);

        li.appendChild(videoNumber);
        li.appendChild(videoInfo);
        videosList.appendChild(li);
    });

    container.appendChild(videosList);
}

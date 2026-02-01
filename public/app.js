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

    // Add convert button
    const convertBtn = document.createElement('button');
    convertBtn.className = 'convert-btn';
    convertBtn.innerHTML = '🎵 Create in YouTube Music';
    convertBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent triggering playlist expansion
        showConversionModal(playlist.id, playlist.snippet.title);
    };

    const videosContainer = document.createElement('div');
    videosContainer.className = 'tracks-container hidden';
    videosContainer.id = `videos-${playlist.id}`;

    card.appendChild(header);
    card.appendChild(convertBtn);
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

    container.appendChild(tracksList);
}

// YouTube Music Conversion Functionality
let currentPlaylistForConversion = null;

// DOM Elements for modal
const convertModal = document.getElementById('convert-modal');
const playlistNameInput = document.getElementById('playlist-name');
const playlistDescriptionInput = document.getElementById('playlist-description');
const cancelConvertBtn = document.getElementById('cancel-convert');
const confirmConvertBtn = document.getElementById('confirm-convert');
const conversionStatus = document.getElementById('conversion-status');

// Event listeners for modal
cancelConvertBtn.addEventListener('click', closeConversionModal);
confirmConvertBtn.addEventListener('click', confirmConversion);

// Close modal when clicking outside
convertModal.addEventListener('click', (e) => {
    if (e.target === convertModal) {
        closeConversionModal();
    }
});

function showConversionModal(playlistId, playlistTitle) {
    currentPlaylistForConversion = playlistId;
    playlistNameInput.value = `${playlistTitle} (Music)`;
    playlistDescriptionInput.value = '';
    conversionStatus.innerHTML = '';
    conversionStatus.classList.add('hidden');
    convertModal.classList.remove('hidden');
    playlistNameInput.focus();
}

function closeConversionModal() {
    convertModal.classList.add('hidden');
    currentPlaylistForConversion = null;
    playlistNameInput.value = '';
    playlistDescriptionInput.value = '';
    conversionStatus.innerHTML = '';
    conversionStatus.classList.add('hidden');
}

async function confirmConversion() {
    const name = playlistNameInput.value.trim();
    const description = playlistDescriptionInput.value.trim();

    if (!name) {
        alert('Please enter a playlist name');
        return;
    }

    if (!currentPlaylistForConversion) {
        alert('No playlist selected');
        return;
    }

    // Disable buttons during conversion
    confirmConvertBtn.disabled = true;
    cancelConvertBtn.disabled = true;

    try {
        // Show progress
        conversionStatus.classList.remove('hidden', 'success', 'error');
        conversionStatus.classList.add('progress');
        conversionStatus.innerHTML = 'Creating playlist...';

        // Step 1: Get all video IDs from the playlist
        const videosData = await fetchYouTubeAPI('/playlistItems', {
            part: 'snippet',
            playlistId: currentPlaylistForConversion,
            maxResults: 50
        });

        const videoIds = videosData.items
            .map(item => item.snippet.resourceId.videoId)
            .filter(id => id); // Filter out any null/undefined

        if (videoIds.length === 0) {
            throw new Error('No videos found in this playlist');
        }

        // Step 2: Create new playlist
        conversionStatus.innerHTML = `Creating playlist "${name}"...`;

        const createResponse = await fetch('/api/create-playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accessToken: accessToken,
                name: name,
                description: description
            })
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create playlist');
        }

        const createData = await createResponse.json();
        const newPlaylistId = createData.playlistId;
        const playlistUrl = createData.url;

        // Step 3: Add videos to playlist
        conversionStatus.innerHTML = `Adding ${videoIds.length} videos to playlist...`;

        const addResponse = await fetch('/api/add-to-playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accessToken: accessToken,
                playlistId: newPlaylistId,
                videoIds: videoIds
            })
        });

        if (!addResponse.ok) {
            throw new Error('Failed to add videos to playlist');
        }

        const addData = await addResponse.json();

        // Show success message
        conversionStatus.classList.remove('progress');
        conversionStatus.classList.add('success');

        let successMessage = `✅ Successfully created playlist with ${addData.added} video${addData.added !== 1 ? 's' : ''}!<br>`;
        successMessage += `<a href="${playlistUrl}" target="_blank">Open in YouTube Music →</a>`;

        if (addData.failed.length > 0) {
            successMessage += `<br><br>⚠️ ${addData.failed.length} video${addData.failed.length !== 1 ? 's' : ''} could not be added (may be deleted or private)`;
        }

        conversionStatus.innerHTML = successMessage;

        // Re-enable cancel button to close
        cancelConvertBtn.disabled = false;
        confirmConvertBtn.disabled = false;

    } catch (error) {
        console.error('Conversion error:', error);

        conversionStatus.classList.remove('progress');
        conversionStatus.classList.add('error');
        conversionStatus.innerHTML = `❌ Error: ${error.message}`;

        // Re-enable buttons
        confirmConvertBtn.disabled = false;
        cancelConvertBtn.disabled = false;
    }
}

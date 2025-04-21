// server.js - Main server for Map Explorer PRO with TikTok Live integration
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const WebSocket = require('ws');
const http = require('http');
const { WebcastPushConnection } = require('tiktok-live-connector');
const config = require('./config');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Create data directory if it doesn't exist
const dataPath = path.join(__dirname, config.server.dataPath);
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

// Use middleware for JSON and static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Check and create ratings.json if it doesn't exist
const ratingsPath = path.join(dataPath, config.server.ratingsFilename);
if (!fs.existsSync(ratingsPath)) {
  // Create a new file with initial structure
  const initialData = {
    places: []
  };
  fs.writeFileSync(ratingsPath, JSON.stringify(initialData, null, 2), 'utf8');
  console.log('Created new ratings.json file');
} else {
  // Check if the file has the correct structure
  try {
    const testRead = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
    // Add places array if missing
    if (!testRead.places) {
      testRead.places = [];
      fs.writeFileSync(ratingsPath, JSON.stringify(testRead, null, 2), 'utf8');
      console.log('Fixed ratings.json structure');
    }
  } catch (error) {
    // If the file has issues, recreate it
    console.error('Error reading ratings.json, recreating file:', error);
    const initialData = {
      places: []
    };
    fs.writeFileSync(ratingsPath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// Queue for location requests
const locationQueue = {
  queue: [],
  currentLocation: null,
  isProcessing: false,
  
  // Add a location to the queue
  addLocation(place, username, profilePic) {
    console.log(`Attempting to add location: "${place}" from user: ${username}`);
    
    // Check if the place is already in the queue
    const isDuplicate = this.queue.some(item => 
      item.place.toLowerCase() === place.toLowerCase()
    );
    
    // Also check if it's the current location
    const isCurrentLocation = this.currentLocation && 
      this.currentLocation.place.toLowerCase() === place.toLowerCase();
    
    if (!isDuplicate && !isCurrentLocation) {
      this.queue.push({
        place,
        username,
        profilePic,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Successfully added "${place}" to the queue from user ${username}`);
      console.log(`Current queue: ${JSON.stringify(this.queue.map(item => item.place))}`);
      
      // If not processing and auto-start is enabled, start processing
      if (!this.isProcessing && config.queue.autoStartProcessing) {
        console.log('Auto-starting queue processing');
        this.startProcessing();
      }
      
      return true;
    } else {
      console.log(`Duplicate location: "${place}" - not added to queue`);
      return false;
    }
  },
  
  // Start processing the queue
  startProcessing() {
    if (this.isProcessing || this.queue.length === 0) {
      console.log(`Cannot start processing: isProcessing=${this.isProcessing}, queue length=${this.queue.length}`);
      return;
    }
    
    console.log('Starting to process location queue');
    this.isProcessing = true;
    this.processNext();
  },
  
  // Process the next item in the queue
  processNext() {
    if (this.queue.length === 0) {
      console.log('Queue is empty, stopping processing');
      this.isProcessing = false;
      this.currentLocation = null;
      return;
    }
    
    // Take the first item from the queue
    this.currentLocation = this.queue.shift();
    console.log(`Processing location: "${this.currentLocation.place}" (${this.queue.length} locations remain in queue)`);
    
    // Start a timer to process the next item
    setTimeout(() => {
      this.processNext();
    }, config.queue.processingInterval);
  },
  
  // Mark the current location as complete
  completeCurrentLocation(data) {
    if (!this.currentLocation) {
      console.log('No current location to complete');
      return;
    }
    
    console.log(`Completed location: "${this.currentLocation.place}"`);
    
    // Save the rating
    const result = saveRating(data);
    console.log(`Rating saved: ${result.success ? 'success' : 'failed'}`);
    
    // Clear the current location
    this.currentLocation = null;
  },
  
  // Get the current queue state
  getState() {
    return {
      queue: this.queue.slice(0, config.queue.maxSize), // Limit the size
      currentLocation: this.currentLocation,
      isProcessing: this.isProcessing
    };
  }
};

// TikTok Live connection
let tiktokConnection = null;
let tiktokStatus = {
  isLiveActive: false,
  viewerCount: 0,
  username: config.tiktok.username,
  liveTitle: 'Map Explorer PRO Live!'
};

const tiktokClients = new Set(); // WebSocket clients for TikTok comments

// Function to save a rating
function saveRating(data) {
  try {
    // Read current ratings data
    let ratingsData;
    try {
      ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
      // Check if places array exists
      if (!ratingsData.places) {
        ratingsData.places = [];
      }
    } catch (readError) {
      console.error('Error reading ratings file, creating new data:', readError);
      ratingsData = { places: [] };
    }
    
    const { place, score, lat, lng } = data;
    
    // Check if the place already exists
    const existingPlaceIndex = ratingsData.places.findIndex(p => 
      p.place.toLowerCase() === place.toLowerCase()
    );
    
    if (existingPlaceIndex !== -1) {
      // Update the score if the place already exists
      ratingsData.places[existingPlaceIndex].score = score;
      ratingsData.places[existingPlaceIndex].visited = new Date().toISOString();
    } else {
      // Add a new place
      ratingsData.places.push({
        place,
        score,
        lat,
        lng,
        visited: new Date().toISOString()
      });
    }
    
    // Sort by score from highest to lowest
    ratingsData.places.sort((a, b) => b.score - a.score);
    
    // Save to file
    fs.writeFileSync(ratingsPath, JSON.stringify(ratingsData, null, 2), 'utf8');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving rating:', error);
    return { success: false, error: 'Error saving rating' };
  }
}

// Function to connect to TikTok Live
function connectToTikTokLive() {
  if (tiktokConnection) {
    // Close existing connection
    try {
      tiktokConnection.disconnect();
    } catch (error) {
      console.error('Error disconnecting from TikTok:', error);
    }
  }
  
  // Create options object
  const options = {
    enableWebsocket: config.tiktok.enableWebsocket,
    enableExtendedGiftInfo: config.tiktok.enableExtendedGiftInfo,
    enableUniqueIds: config.tiktok.enableUniqueIds,
    enableRoomInfo: config.tiktok.enableRoomInfo,
    requestPollingIntervalMs: config.tiktok.requestPollingIntervalMs,
    clientParams: config.tiktok.clientParams
  };
  
  // Add sessionId only if it's provided and not empty
  if (config.tiktok.sessionId && config.tiktok.sessionId.trim() !== '') {
    options.sessionId = config.tiktok.sessionId;
  }
  
  // Create a new connection
  tiktokConnection = new WebcastPushConnection(
    config.tiktok.username,
    options
  );
  
  // Connect to TikTok Live
  tiktokConnection.connect()
    .then(state => {
      console.log(`Connected to TikTok Live for user ${config.tiktok.username}`);
      tiktokStatus.isLiveActive = true;
      tiktokStatus.liveTitle = state.roomInfo?.title || 'Map Explorer PRO Live!';
      
      // Set up event handlers
      setupTikTokEventHandlers();
    })
    .catch(err => {
      console.error('Failed to connect to TikTok Live:', err);
      tiktokStatus.isLiveActive = false;
      
      // Try to reconnect after a delay
      setTimeout(connectToTikTokLive, 30000);
    });
}

// Set up TikTok event handlers
function setupTikTokEventHandlers() {
  // Keep track of users who have joined
  const joinedUsers = new Set();
  
  // Handle comments
  tiktokConnection.on('chat', comment => {
    // Using 'chat' event instead of 'comment' - this is the correct event name
    
    const text = comment.comment || '';
    const username = comment.uniqueId || comment.userId || 'TikTok User';
    const profilePic = comment.profilePictureUrl || '';
    
    console.log(`Chat message from ${username}: ${text}`);
    
    // Check if it's a location request - case insensitive check
    if (text.toLowerCase().startsWith('location:')) {
      const place = text.substring(text.toLowerCase().indexOf('location:') + 'location:'.length).trim();
      
      if (place) {
        console.log(`Location request detected: "${place}" from user: ${username}`);
        
        // Add to the queue
        const added = locationQueue.addLocation(place, username, profilePic);
        if (added) {
          console.log(`Successfully added "${place}" to queue`);
        } else {
          console.log(`"${place}" is already in queue or invalid`);
        }
      }
    }
    
    // Broadcast to all WebSocket clients
    const commentData = {
      text,
      username,
      profilePic,
      timestamp: new Date().toISOString()
    };
    
    broadcastToTikTokClients(commentData);
  });
  
  // Handle member join events
  tiktokConnection.on('member', member => {
    console.log(`Member joined: ${member.uniqueId || member.userId}`);
    
    const username = member.uniqueId || member.userId || 'TikTok User';
    const profilePic = member.profilePictureUrl || '';
    
    // Check if this is a new user
    if (!joinedUsers.has(username)) {
      joinedUsers.add(username);
      
      // Broadcast welcome event to clients
      const welcomeData = {
        event: 'welcome',
        username,
        profilePic,
        timestamp: new Date().toISOString()
      };
      
      broadcastToTikTokClients(welcomeData);
    }
  });
  
  // Handle room info updates
  tiktokConnection.on('roomUser', roomData => {
    console.log(`Room update: ${roomData.viewerCount || 0} viewers`);
    tiktokStatus.viewerCount = roomData.viewerCount || 0;
  });
  
  // Handle stream end
  tiktokConnection.on('streamEnd', () => {
    console.log('TikTok Live stream ended');
    tiktokStatus.isLiveActive = false;
    
    // Try to reconnect after a delay
    setTimeout(connectToTikTokLive, 30000);
  });
  
  // Handle connection errors
  tiktokConnection.on('error', err => {
    console.error('TikTok Live connection error:', err);
  });
  
  // Add this to log all events for debugging
  tiktokConnection.on('rawData', (messageType, data) => {
    console.log(`Received raw data: ${messageType}`);
  });
}

// Broadcast a comment to all TikTok WebSocket clients
function broadcastToTikTokClients(data) {
  tiktokClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// API endpoint for geocoding (convert place names to coordinates)
app.get('/api/geocode', async (req, res) => {
  try {
    const place = req.query.place;
    // Use OpenStreetMap Nominatim API for geocoding
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
    
    if (response.data && response.data.length > 0) {
      const location = {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name
      };
      res.json(location);
    } else {
      res.status(404).json({ error: 'Location not found' });
    }
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'Error geocoding location' });
  }
});

// API endpoint to get all ratings
app.get('/api/ratings', (req, res) => {
  try {
    const ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
    // Check if places array exists
    if (!ratingsData.places) {
      ratingsData.places = [];
      fs.writeFileSync(ratingsPath, JSON.stringify(ratingsData, null, 2), 'utf8');
    }
    res.json(ratingsData);
  } catch (error) {
    console.error('Error reading ratings:', error);
    // If there's an error, create a new file and return empty data
    const initialData = {
      places: []
    };
    fs.writeFileSync(ratingsPath, JSON.stringify(initialData, null, 2), 'utf8');
    res.json(initialData);
  }
});

// API endpoint for saving ratings
app.post('/api/ratings', (req, res) => {
  const result = saveRating(req.body);
  res.json(result);
});

// API endpoint to get top 5 places
app.get('/api/ratings/top', (req, res) => {
  try {
    const ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
    // Check if places array exists
    if (!ratingsData.places) {
      ratingsData.places = [];
      fs.writeFileSync(ratingsPath, JSON.stringify(ratingsData, null, 2), 'utf8');
    }
    
    // Sort and get only the top 5
    const topPlaces = ratingsData.places
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    res.json({ topPlaces });
  } catch (error) {
    console.error('Error getting top ratings:', error);
    // If there's an error, return empty data
    res.json({ topPlaces: [] });
  }
});

// API endpoint to get the current queue
app.get('/api/queue', (req, res) => {
  res.json(locationQueue.getState());
});

// API endpoint to mark a location as complete
app.post('/api/queue/complete', (req, res) => {
  locationQueue.completeCurrentLocation(req.body);
  res.json({ success: true });
});

// API endpoint to get TikTok status
app.get('/api/tiktok/status', (req, res) => {
  res.json(tiktokStatus);
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const path = req.url;
  
  if (path === '/api/tiktok/comments') {
    // Add to TikTok clients
    tiktokClients.add(ws);
    console.log('TikTok comments WebSocket client connected');
    
    ws.on('close', () => {
      tiktokClients.delete(ws);
      console.log('TikTok comments WebSocket client disconnected');
    });
  }
});

// Start the server
server.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`);
  
  // Connect to TikTok Live
  connectToTikTokLive();
});
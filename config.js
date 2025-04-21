/**
 * config.js - Configuration for Map Explorer PRO with TikTok Live Integration
 */

module.exports = {
    // TikTok Live configuration
    tiktok: {
      // IMPORTANT: Enter the username WITHOUT the '@' symbol
      // Example: If your TikTok profile is tiktok.com/@johndoe, enter just 'johndoe'
      username: 'firstisalwayshappy', // Your TikTok username WITHOUT '@'
      
      // sessionId is optional - you can leave it as empty string 
      // in most cases, just the username is enough
      sessionId: '', 
      enableWebsocket: true, // Use WebSocket for faster connection
      enableExtendedGiftInfo: false, // We don't need extended gift info
      enableUniqueIds: true, // Enable unique IDs for users
      enableRoomInfo: true, // Enable room info for user profile pics
      requestPollingIntervalMs: 2000, // Poll for updates every 2 seconds
      clientParams: {
        app_language: 'en-US',
        device_platform: 'web'
      }
    },
    
    // Queue configuration
    queue: {
      maxSize: 10, // Maximum queue size
      processingInterval: 8000, // Process a new location every 8 seconds
      autoStartProcessing: true // Start processing queue automatically
    },
    
    // Server configuration
    server: {
      port: process.env.PORT || 3000,
      dataPath: './data',
      ratingsFilename: 'ratings.json'
    },
    
    // Map configuration
    map: {
      defaultLocation: {
        lat: 48.8566,
        lng: 2.3522,
        name: 'Paris'
      },
      animationDuration: 5000 // Animation duration in milliseconds
    }
  };
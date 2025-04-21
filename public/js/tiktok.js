/**
 * tiktok.js - Client-side interface for TikTok live status
 * Map Explorer PRO - Cute Edition
 */

class TikTokInterface {
    constructor() {
      this.isLiveActive = false;
      this.viewerCount = 0;
      this.username = '';
      this.liveTitle = '';
      this.statusUpdateCallback = null;
      this.commentReceivedCallback = null;
      
      // Initialize with server status
      this.fetchTikTokStatus();
      
      // Set up polling for TikTok status updates
      setInterval(() => {
        this.fetchTikTokStatus();
      }, 5000); // Poll every 5 seconds
    }
    
    // Fetch the current TikTok live status from the server
    async fetchTikTokStatus() {
      try {
        const response = await fetch('/api/tiktok/status');
        if (!response.ok) {
          console.error('Failed to fetch TikTok status:', response.statusText);
          return;
        }
        
        const data = await response.json();
        this.isLiveActive = data.isLiveActive;
        this.viewerCount = data.viewerCount || 0;
        this.username = data.username || '';
        this.liveTitle = data.liveTitle || '';
        
        // Notify any listeners that the status has updated
        if (this.statusUpdateCallback) {
          this.statusUpdateCallback({
            isLiveActive: this.isLiveActive,
            viewerCount: this.viewerCount,
            username: this.username,
            liveTitle: this.liveTitle
          });
        }
      } catch (error) {
        console.error('Error fetching TikTok status:', error);
      }
    }
    
    // Set up WebSocket connection for real-time comments
    setupCommentsWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/tiktok/comments`;
      
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established for TikTok comments');
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Check if it's a welcome event
          if (data.event === 'welcome') {
            console.log(`Welcome event received for: ${data.username}`);
            this.showWelcomePopup(data.username, data.profilePic);
          } 
          // If it's a comment
          else if (data.text) {
            // Process the comment
            if (this.commentReceivedCallback) {
              this.commentReceivedCallback(data);
            }
            
            // Display the comment in the UI
            this.displayComment(data);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socket.onclose = () => {
        console.log('WebSocket connection closed');
        // Try to reconnect after a delay
        setTimeout(() => {
          this.setupCommentsWebSocket();
        }, 5000);
      };
    }
    
    // Show welcome popup for new viewers
    showWelcomePopup(username, profilePic) {
      const welcomePopup = document.getElementById('welcome-popup');
      const welcomeUsername = document.getElementById('welcome-username');
      const welcomeUserPic = document.getElementById('welcome-user-pic');
      
      if (!welcomePopup || !welcomeUsername || !welcomeUserPic) return;
      
      // Set the username and profile picture
      welcomeUsername.textContent = username || 'TikTok User';
      
      // Set profile picture if available
      if (profilePic) {
        welcomeUserPic.src = profilePic;
      } else {
        welcomeUserPic.src = '/assets/images/default-avatar.png';
      }
      
      // Show the popup
      welcomePopup.classList.add('active');
      
      // Play a sound if available
      try {
        if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
          window.SoundSystem.play('chime');
        }
      } catch (err) {
        console.error('Error playing welcome sound:', err);
      }
      
      // Hide the popup after 5 seconds
      setTimeout(() => {
        welcomePopup.classList.remove('active');
      }, 5000);
    }
    
    // Display a comment in the comments container
    displayComment(comment) {
      const commentsContainer = document.getElementById('tiktok-comments');
      if (!commentsContainer) return;
      
      const commentElement = document.createElement('div');
      commentElement.className = 'tiktok-comment animate-fade-in';
      
      // Check if it's a location request
      const isLocationRequest = comment.text && 
        comment.text.toLowerCase().startsWith('location:');
      
      // Apply special styling for location requests
      if (isLocationRequest) {
        commentElement.classList.add('location-request');
      }
      
      commentElement.innerHTML = `
        <div class="comment-user">
          <img src="${comment.profilePic || '/assets/images/default-avatar.png'}" alt="${comment.username}" class="comment-avatar">
          <span class="comment-username">${comment.username}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
      `;
      
      // Add to the top of the container
      commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
      
      // Limit the number of comments shown (keep last 10)
      while (commentsContainer.children.length > 10) {
        commentsContainer.removeChild(commentsContainer.lastChild);
      }
      
      // Auto-remove the comment after 10 seconds
      setTimeout(() => {
        commentElement.classList.add('comment-fading');
        setTimeout(() => {
          if (commentsContainer.contains(commentElement)) {
            commentsContainer.removeChild(commentElement);
          }
        }, 500);
      }, 10000);
    }
    
    // Set callback for TikTok status updates
    onStatusUpdate(callback) {
      this.statusUpdateCallback = callback;
    }
    
    // Set callback for when a comment is received
    onCommentReceived(callback) {
      this.commentReceivedCallback = callback;
    }
    
    // Get the current TikTok status
    getStatus() {
      return {
        isLiveActive: this.isLiveActive,
        viewerCount: this.viewerCount,
        username: this.username,
        liveTitle: this.liveTitle
      };
    }
  }
  
  // Initialize the TikTok interface when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    // Create the TikTok interface
    window.tiktokInterface = new TikTokInterface();
    
    // Set up the comments WebSocket
    window.tiktokInterface.setupCommentsWebSocket();
    
    // Update the live status UI when we get updates
    window.tiktokInterface.onStatusUpdate((status) => {
      const liveStatusElement = document.getElementById('tiktok-live-status');
      const viewerCountElement = document.getElementById('tiktok-viewer-count');
      const liveTitleElement = document.getElementById('tiktok-live-title');
      
      if (liveStatusElement) {
        if (status.isLiveActive) {
          liveStatusElement.textContent = '🔴 LIVE';
          liveStatusElement.classList.add('live-active');
        } else {
          liveStatusElement.textContent = '⚫ OFFLINE';
          liveStatusElement.classList.remove('live-active');
        }
      }
      
      if (viewerCountElement) {
        viewerCountElement.textContent = `👀 ${status.viewerCount.toLocaleString()}`;
      }
      
      if (liveTitleElement) {
        liveTitleElement.textContent = status.liveTitle;
      }
    });
  });
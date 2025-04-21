/**
 * queue.js - Client-side queue management for TikTok Live comments
 * Map Explorer PRO - Cute Edition
 */

// Queue management class
class LocationQueue {
  constructor() {
    this.queue = [];
    this.currentLocation = null;
    this.isProcessing = false;
    this.queueUpdateCallback = null;
    this.locationSelectedCallback = null;
    this.animationCompleteCallback = null;
    this.lastProcessedLocation = null;
    
    // Initialize polling for queue updates
    this.startPolling();
  }
  
  // Start polling the server for queue updates
  startPolling() {
    console.log('Starting queue polling');
    setInterval(() => {
      this.fetchQueueFromServer();
    }, 2000); // Poll every 2 seconds
  }
  
  // Fetch the current queue from the server
  async fetchQueueFromServer() {
    try {
      const response = await fetch('/api/queue');
      if (!response.ok) {
        console.error('Failed to fetch queue:', response.statusText);
        return;
      }
      
      const data = await response.json();
      this.queue = data.queue || [];
      
      // Check if current location has changed
      const newLocationReceived = data.currentLocation && 
        (!this.currentLocation || 
         this.currentLocation.place !== data.currentLocation.place);
      
      this.currentLocation = data.currentLocation;
      this.isProcessing = data.isProcessing;
      
      // Notify any listeners that the queue has updated
      if (this.queueUpdateCallback) {
        this.queueUpdateCallback(this.queue, this.currentLocation, this.isProcessing);
      }
      
      // If a new location is being processed, trigger the location selection
      if (newLocationReceived && this.currentLocation && this.locationSelectedCallback) {
        console.log(`New location selected from server: ${this.currentLocation.place}`);
        
        // Check if we've already processed this location to avoid duplicates
        if (this.lastProcessedLocation !== this.currentLocation.place) {
          this.lastProcessedLocation = this.currentLocation.place;
          this.locationSelectedCallback(this.currentLocation);
        }
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  }
  
  // Set callback for when the queue updates
  onQueueUpdate(callback) {
    this.queueUpdateCallback = callback;
  }
  
  // Set callback for when a new location is selected for processing
  onLocationSelected(callback) {
    this.locationSelectedCallback = callback;
    console.log('Location selection callback registered');
  }
  
  // Set callback for when a location animation is complete
  onAnimationComplete(callback) {
    this.animationCompleteCallback = callback;
  }
  
  // Notify the server that the current location animation is complete
  async notifyAnimationComplete(placeData) {
    if (!this.currentLocation) {
      console.log('No current location to mark as complete');
      return;
    }
    
    console.log(`Notifying server that ${placeData.place} animation is complete`);
    
    try {
      const response = await fetch('/api/queue/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          place: placeData.place,
          score: placeData.score,
          lat: placeData.lat,
          lng: placeData.lng
        })
      });
      
      if (!response.ok) {
        console.error('Failed to mark location as complete:', response.statusText);
        return;
      }
      
      console.log(`Successfully marked ${placeData.place} as complete`);
      
      // Trigger the animation complete callback
      if (this.animationCompleteCallback) {
        this.animationCompleteCallback();
      }
      
      // Immediately fetch the updated queue
      this.fetchQueueFromServer();
    } catch (error) {
      console.error('Error notifying animation complete:', error);
    }
  }
  
  // Get the current queue state
  getQueueState() {
    return {
      queue: this.queue,
      currentLocation: this.currentLocation,
      isProcessing: this.isProcessing
    };
  }
}

// Create a global queue instance
window.locationQueue = new LocationQueue();

// UI components for displaying the queue
class QueueUI {
  constructor() {
    this.queueContainer = document.getElementById('queue-container');
    this.queueList = document.getElementById('queue-list');
    this.currentItem = document.getElementById('current-item');
    this.emptyQueueMessage = document.getElementById('empty-queue-message');
    
    // Initialize the UI
    this.updateUI([], null, false);
    
    // Set up the queue update callback
    window.locationQueue.onQueueUpdate((queue, currentLocation, isProcessing) => {
      this.updateUI(queue, currentLocation, isProcessing);
    });
  }
  
  // Update the queue UI
  updateUI(queue, currentLocation, isProcessing) {
    if (!this.queueContainer) return;
    
    // Clear the queue list
    this.queueList.innerHTML = '';
    
    // Update the current item
    if (currentLocation) {
      this.currentItem.innerHTML = `
        <div class="current-location">
          <div class="current-location-header">
            <span class="current-badge">🚀 Exploring</span>
            <span class="current-location-name">${currentLocation.place}</span>
          </div>
          <div class="current-location-user">
            <img src="${currentLocation.profilePic || '/assets/images/default-avatar.png'}" alt="User" class="current-location-avatar">
            <span class="current-location-username">${currentLocation.username || 'TikTok User'}</span>
          </div>
        </div>
      `;
      this.currentItem.classList.remove('hidden');
    } else {
      this.currentItem.classList.add('hidden');
    }
    
    // Show or hide empty queue message
    if (queue.length === 0) {
      this.emptyQueueMessage.classList.remove('hidden');
    } else {
      this.emptyQueueMessage.classList.add('hidden');
      
      // Add each queue item
      queue.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'queue-item animate-fade-in';
        listItem.innerHTML = `
          <div class="queue-item-number">${index + 1}</div>
          <div class="queue-item-content">
            <div class="queue-item-place">${item.place}</div>
            <div class="queue-item-user">
              <img src="${item.profilePic || '/assets/images/default-avatar.png'}" alt="User" class="queue-item-avatar">
              <span>${item.username || 'TikTok User'}</span>
            </div>
          </div>
        `;
        this.queueList.appendChild(listItem);
      });
    }
  }
}

// Initialize the queue UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create the queue UI instance
  window.queueUI = new QueueUI();
});
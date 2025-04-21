/**
 * ui.js - Manages UI components of the application
 * Map Explorer PRO - TikTok Live Edition
 */

// Show/hide functions for various components
function toggleLeaderboard() {
  const leaderboardContainer = document.querySelector('.leaderboard-container');
  leaderboardContainer.classList.toggle('active');
  
  // Reload leaderboard data when shown
  if (leaderboardContainer.classList.contains('active')) {
    loadLeaderboard();
  }
}

// Add animations when page loads
function addLoadingAnimations() {
  const elements = [
    document.querySelector('.tiktok-status-bar'),
    document.querySelector('.leaderboard'),
    document.querySelector('#queue-container'),
    document.querySelector('.tiktok-comments-container'),
    document.querySelector('.stream-overlay')
  ];
  
  elements.forEach((element, index) => {
    if (element) {
      element.classList.add('animate-fade-in');
      element.style.animationDelay = `${index * 0.1}s`;
    }
  });
}

// Add button hover effects
function addButtonEffects() {
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.classList.add('animate-pulse');
    });
    
    button.addEventListener('mouseleave', () => {
      button.classList.remove('animate-pulse');
    });
  });
}

// Add ripple effect when buttons are clicked
function addRippleEffect() {
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      ripple.style.borderRadius = '50%';
      ripple.style.width = '100px';
      ripple.style.height = '100px';
      ripple.style.transform = 'translate(-50%, -50%)';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.animation = 'ripple 0.6s linear';
      ripple.style.pointerEvents = 'none';
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // Add keyframe for ripple effect
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes ripple {
      0% {
        width: 0px;
        height: 0px;
        opacity: 0.6;
      }
      100% {
        width: 500px;
        height: 500px;
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Update leaderboard with animation and sound
function updateLeaderboard() {
  // Play sound when loading leaderboard
  try {
    if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
      window.SoundSystem.play('chime');
    } else {
      console.warn('SoundSystem not available or play method not found');
    }
  } catch (err) {
    console.error('Error playing leaderboard sound:', err);
  }
  
  // Show refresh effect
  const leaderboardContent = document.querySelector('.leaderboard-content');
  if (leaderboardContent) {
    leaderboardContent.style.opacity = '0.5';
    leaderboardContent.style.transform = 'scale(0.95)';
    setTimeout(() => {
      leaderboardContent.style.opacity = '1';
      leaderboardContent.style.transform = 'scale(1)';
    }, 300);
  }
  
  // Load leaderboard data
  loadLeaderboard();
  
  // Show notification
  showNotification('Leaderboard refreshed ✨', 'info');
}

// Show notification toast
function showNotification(message, type = 'success', animate = false) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  
  // Set color based on notification type
  switch(type) {
    case 'error':
      notification.style.background = '#FF78A9'; // Brighter Pink
      notification.style.color = '#a24857';
      break;
    case 'warning':
      notification.style.background = '#FFDA4A'; // Brighter Light Yellow
      notification.style.color = '#8c7800';
      break;
    case 'info':
      notification.style.background = '#75C6E0'; // Brighter Light Blue
      notification.style.color = '#336b72';
      break;
    case 'success':
    default:
      notification.style.background = '#80E8B6'; // Brighter Mint Green
      notification.style.color = '#2d7a5d';
      break;
  }
  
  // Set message
  notificationMessage.textContent = message;
  
  // Add animation if specified
  if (animate) {
    notificationMessage.classList.add('animate-bounce');
    setTimeout(() => {
      notificationMessage.classList.remove('animate-bounce');
    }, 1000);
  }
  
  // Show notification
  notification.classList.add('active');
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('active');
  }, 3000);
}

// Adjust leaderboard height to show all items without scrollbar
function adjustLeaderboardHeight() {
  const leaderboardContent = document.querySelector('.leaderboard-content');
  const topPlaces = document.getElementById('top-places');
  
  if (leaderboardContent && topPlaces) {
    // Calculate height based on number of items
    const itemCount = topPlaces.children.length;
    if (itemCount === 0) {
      // If no items
      leaderboardContent.style.padding = '20px';
      leaderboardContent.style.height = 'auto';
    } else {
      // If items exist, adjust height to fit
      leaderboardContent.style.height = 'auto';
      // Remove scrollbar
      leaderboardContent.style.overflowY = 'visible';
    }
  }
}

// Add example animation to stream instructions
function animateStreamInstructions() {
  const exampleComment = document.querySelector('.example-comment');
  
  if (exampleComment) {
    // Cycle through different example locations
    const locations = [
      'Grand Canyon',
      'Mount Fuji',
      'Great Wall of China',
      'Eiffel Tower',
      'Taj Mahal',
      'Sydney Opera House',
      'Niagara Falls',
      'Machu Picchu'
    ];
    
    let currentIndex = 0;
    
    // Change location example every 5 seconds
    setInterval(() => {
      const exampleText = exampleComment.querySelector('.example-text');
      if (exampleText) {
        // Fade out
        exampleText.style.opacity = '0';
        
        setTimeout(() => {
          // Change text and fade in
          exampleText.textContent = `Location: ${locations[currentIndex]}`;
          exampleText.style.opacity = '1';
          
          // Update index for next time
          currentIndex = (currentIndex + 1) % locations.length;
        }, 500);
      }
    }, 5000);
    
    // Add initial style for smooth transition
    const style = document.createElement('style');
    style.innerHTML = `
      .example-text {
        transition: opacity 0.5s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing UI...');
  
  // Add loading animations
  addLoadingAnimations();
  
  // Add button effects
  addButtonEffects();
  
  // Add ripple effect
  addRippleEffect();
  
  // Adjust leaderboard height
  adjustLeaderboardHeight();
  
  // Animate stream instructions
  animateStreamInstructions();
  
  // Set up MutationObserver to adjust leaderboard height when content changes
  const observer = new MutationObserver(adjustLeaderboardHeight);
  const topPlaces = document.getElementById('top-places');
  if (topPlaces) {
    observer.observe(topPlaces, { childList: true, subtree: true });
  }
  
  // Auto-refresh leaderboard every minute
  setInterval(updateLeaderboard, 60000);
});
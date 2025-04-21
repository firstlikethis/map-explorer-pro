/**
 * rating.js - Manages place rating system
 * Map Explorer PRO - TikTok Live Edition
 */

// Rating system variables
let ratingInProgress = false;
let finalScore = 0;
let currentRatingPlace = '';
let currentRatingLat = 0;
let currentRatingLng = 0;
let countInterval;
let autoCloseTimeout; // For automatic closing
let autoSaveTimeout; // For automatic saving

// Function to add confetti effect
function addConfettiEffect() {
  // Create element for confetti and stars
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  // Create several confetti pieces
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = getRandomColor();
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    if (Math.random() > 0.6) {
      // Create star shape
      confetti.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15">
          <path fill="${getRandomColor()}" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
        </svg>
      `;
    } else if (Math.random() > 0.3) {
      // Create heart shape
      confetti.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15">
          <path fill="${getRandomColor()}" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
        </svg>
      `;
    } else {
      // Create other cute shapes
      const emojis = ['🌟', '✨', '💖', '🎀', '🌈', '🦄', '🍭', '🌸'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.innerHTML = `<div style="font-size: 20px;">${randomEmoji}</div>`;
    }
    
    confettiContainer.appendChild(confetti);
    
    // Create animation for each piece
    const animation = confetti.animate([
      { 
        transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(0deg)`,
        opacity: 1 
      },
      { 
        transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 + 100}px) rotate(${Math.random() * 360}deg)`,
        opacity: 0 
      }
    ], {
      duration: 1500 + Math.random() * 1500,
      easing: 'cubic-bezier(0,0,0.2,1)',
      fill: 'forwards'
    });
    
    // Remove when animation ends
    animation.onfinish = () => {
      confetti.remove();
      // Remove container when empty
      if (confettiContainer.children.length === 0) {
        confettiContainer.remove();
      }
    };
  }
}

// Function to get random pastel color
function getRandomColor() {
  const colors = [
    '#FF78A9', // Pink
    '#75C6E0', // Light Blue
    '#FFDA4A', // Light Yellow
    '#80E8B6', // Mint Green
    '#C278FF', // Lavender
    '#FFB26B', // Peach
    '#c9c3f7', // Light Purple
    '#ff9aa2', // Light Red
    '#ffdfba'  // Light Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Function to open rating modal
function openRatingModal(placeName, lat, lng) {
  console.log('Rating modal opened for:', placeName, lat, lng);
  
  // Play rating sound
  try {
    if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
      window.SoundSystem.play('rating');
    } else {
      console.warn('SoundSystem not available or play method not found');
    }
  } catch (err) {
    console.error('Error playing rating sound:', err);
  }
  
  // Store place details
  currentRatingPlace = placeName;
  currentRatingLat = lat;
  currentRatingLng = lng;
  
  // Set place name in rating modal
  document.getElementById('rating-place-name').textContent = placeName;
  
  // Reset score counter and progress bar
  document.getElementById('score-counter').textContent = '0';
  document.getElementById('score-counter').className = 'score-counter';
  document.getElementById('progress-fill').style.width = '0%';
  
  // Get modal element
  const modal = document.getElementById('rating-modal');
  
  // Set modal initial position for animation
  const modalContent = document.querySelector('.modal-content');
  modalContent.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  modalContent.style.transform = 'translateY(-50px) scale(0.9)';
  
  // Show rating modal with animation
  modal.classList.add('active');
  
  // Animate slide in
  setTimeout(() => {
    modalContent.style.transform = 'translateY(0) scale(1)';
  }, 100);
  
  // Add confetti effect when modal appears
  addConfettiEffect();
  
  // Start counting score
  setTimeout(() => {
    console.log('Starting score counting...');
    startCountingScore();
  }, 500);

  // Clear previous timeouts (if any)
  if (autoCloseTimeout) {
    clearTimeout(autoCloseTimeout);
  }
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
}

// Function to start counting score from 1-100
function startCountingScore() {
  if (ratingInProgress) return;
  
  console.log('Rating in progress started...');
  ratingInProgress = true;
  let score = 0;
  const scoreCounter = document.getElementById('score-counter');
  const progressFill = document.getElementById('progress-fill');
  const message = document.querySelector('.rating-message');
  
  // Generate random final score between 1-100
  finalScore = Math.floor(Math.random() * 100) + 1;
  console.log('Final random score:', finalScore);
  
  // Set counting speed to take about 3 seconds
  const speed = 30; // milliseconds
  const step = 1;
  
  message.textContent = 'Calculating score for this location...';
  
  // Use setInterval to count up score
  countInterval = setInterval(() => {
    score += step;
    console.log('Current score:', score);
    
    // Play sound every 5 points
    if (score % 5 === 0) {
      try {
        if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
          window.SoundSystem.play('chime');
        }
      } catch (err) {
        console.error('Error playing counting sound:', err);
      }
    }
    
    // Update score counter and progress bar
    scoreCounter.textContent = score;
    progressFill.style.width = `${score}%`;
    
    // Change color based on score level
    if (score >= 80) {
      scoreCounter.className = 'score-counter high';
    } else if (score < 40) {
      scoreCounter.className = 'score-counter low';
    } else {
      scoreCounter.className = 'score-counter';
    }
    
    // Stop counting when final score is reached
    if (score >= finalScore) {
      clearInterval(countInterval);
      console.log('Final score reached:', finalScore);
      
      // Add bounce effect when counting is done
      scoreCounter.classList.add('animate-bounce');
      
      // Add confetti and play sound for high scores
      if (finalScore >= 80) {
        addConfettiEffect();
        // Play special sound for high rating
        try {
          if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
            window.SoundSystem.play('highRating');
          } else {
            console.warn('SoundSystem not available or play method not found');
          }
        } catch (err) {
          console.error('Error playing high rating sound:', err);
        }
      }
      
      // Update message based on score
      if (finalScore >= 85) {
        message.textContent = '🌟 Amazing place! Top-tier score';
        message.style.color = '#80E8B6'; // Mint
      } else if (finalScore >= 70) {
        message.textContent = '✨ This place is definitely worth visiting!';
        message.style.color = '#75C6E0'; // Light Blue
      } else if (finalScore >= 55) {
        message.textContent = '🌈 This place is quite interesting';
        message.style.color = '#C278FF'; // Lavender
      } else if (finalScore >= 40) {
        message.textContent = '👍 This place is satisfactory';
        message.style.color = '#FFB26B'; // Peach
      } else {
        message.textContent = '🌱 This place is quite simple';
        message.style.color = '#FF78A9'; // Pink
      }
      
      // End rating progress
      ratingInProgress = false;
      
      // Automatically save score after 1 second
      autoSaveTimeout = setTimeout(() => {
        saveRating(true);
      }, 1000);
      
      // Automatically close modal after 5 seconds
      autoCloseTimeout = setTimeout(() => {
        closeRatingModal();
      }, 5000);
    }
  }, speed);
}

// Function to close rating modal
function closeRatingModal() {
  document.getElementById('rating-modal').classList.remove('active');
  
  // Stop counting if still in progress
  if (countInterval) {
    clearInterval(countInterval);
    ratingInProgress = false;
  }
  
  // Clear auto-close timeout
  if (autoCloseTimeout) {
    clearTimeout(autoCloseTimeout);
    autoCloseTimeout = null;
  }
  
  // Clear auto-save timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
}

// Function to save rating
async function saveRating(isAutoSave = false) {
  try {
    // If rating is in progress, wait until complete
    if (ratingInProgress) {
      return;
    }
    
    // Create rating data object
    const ratingData = {
      place: currentRatingPlace,
      score: finalScore,
      lat: currentRatingLat,
      lng: currentRatingLng
    };
    
    // Notify the queue system that this location is complete
    if (window.locationQueue) {
      window.locationQueue.notifyAnimationComplete(ratingData);
    }
    
    // Send rating data to server
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ratingData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Only show notification for successful saving but with minimal UI impact
      // This is now automatic and doesn't need to distract the stream
      if (!isAutoSave) {
        showNotification(`Score saved: ${finalScore} for ${currentRatingPlace}`, 'success');
      }
      
      // Update leaderboard
      loadLeaderboard();
    } else {
      console.error('Error saving rating:', data.error);
    }
  } catch (error) {
    console.error('Error saving rating:', error);
  }
}

// Function to load Top 5 highest rated places
async function loadLeaderboard() {
  try {
    const response = await fetch('/api/ratings/top');
    const data = await response.json();
    
    if (response.ok) {
      // Update places list
      updateLeaderboardUI(data.topPlaces);
    } else {
      console.error('Error loading leaderboard:', data.error);
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

// Function to update leaderboard UI
function updateLeaderboardUI(places) {
  const leaderboardList = document.getElementById('top-places');
  
  // Clear previous list
  leaderboardList.innerHTML = '';
  
  // If no data
  if (!places || places.length === 0) {
    leaderboardList.innerHTML = '<li class="no-places">No places yet in the system</li>';
    return;
  }
  
  // Special rank icons
  const specialRankIcons = [
    '👑', // Rank 1
    '🥈', // Rank 2
    '🥉'  // Rank 3
  ];
  
  // Create new list
  places.forEach((place, index) => {
    const rankClass = index < 3 ? `rank-${index + 1}` : '';
    
    const listItem = document.createElement('li');
    listItem.className = 'place-item animate-fade-in';
    listItem.style.animationDelay = `${index * 0.1}s`;
    
    // Split place name and details (if any)
    let placeName = place.place;
    let placeLocation = '';
    
    // Check for separator to split between place name and country
    if (place.place.includes(' - ')) {
      const parts = place.place.split(' - ');
      placeName = parts[0].trim();
      placeLocation = parts[1].trim();
    } else if (place.place.includes(', ')) {
      const parts = place.place.split(', ');
      placeName = parts[0].trim();
      placeLocation = parts.slice(1).join(', ').trim();
    }
    
    // Create HTML for list item
    listItem.innerHTML = `
      <div class="place-rank ${rankClass}">
        ${index < 3 ? specialRankIcons[index] : index + 1}
      </div>
      <div class="place-info">
        <div class="place-name">${placeName}</div>
        ${placeLocation ? `<div class="place-location">${placeLocation}</div>` : ''}
        <div class="place-score">${place.score} points</div>
      </div>
    `;
    
    leaderboardList.appendChild(listItem);
  });
}

// Show notification with brighter pastel colors
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing rating system...');
  
  // Load leaderboard
  loadLeaderboard();
});
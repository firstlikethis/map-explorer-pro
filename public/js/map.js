/**
 * map.js - Manages map and airplane movement
 * Map Explorer PRO - TikTok Live Edition
 */

// Map variables and components
// The 'map' variable is declared in index.html
let currentMarker;
let destinationMarker;
let pastRouteLine;
let futureRouteLine;
let airplaneMarker;
let distanceLabel;
let remainingDistanceLabel;
let totalDistance = 0;
let animationInProgress = false;
let currentPosition = { lat: 48.8566, lng: 2.3522 }; // Paris coordinates
let currentDestination = '';

// Camera control variables
let cameraFollow = true;
let zoomOutTriggered = false;

// Pastel colors palette
const pastelColors = {
  primary: '#FF78A9',  // Pink
  secondary: '#75C6E0', // Light Blue
  accent: '#FFDA4A',    // Light Yellow
  mint: '#80E8B6',     // Mint Green
  lavender: '#C278FF',  // Lavender
  peach: '#FFB26B'      // Peach
};

// Initialize the map
function initMap() {
  // Create the map using Leaflet
  map = L.map('map', {
    zoomControl: false // Hide default zoom controls
  }).setView([currentPosition.lat, currentPosition.lng], 5);
  
  console.log('Map initialized');
  
  // Add custom positioned zoom control
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
  
  // Add OpenStreetMap tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Customize zoom control CSS
  document.querySelector('.leaflet-control-zoom').style.borderRadius = '20px';
  document.querySelector('.leaflet-control-zoom').style.overflow = 'hidden';
  document.querySelector('.leaflet-control-zoom').style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
  
  // Add marker for starting point
  const initialIcon = createMarkerIcon('primary');
  
  currentMarker = L.marker([currentPosition.lat, currentPosition.lng], {
    icon: initialIcon
  }).addTo(map)
    .bindPopup(createCustomPopup('🗼 Paris - Starting Point'))
    .openPopup();
  
  // Create airplane icon
  const airplaneIcon = createAirplaneIcon(0);
  
  // Create airplane marker (but don't add to map yet)
  airplaneMarker = L.marker([0, 0], { icon: airplaneIcon, zIndexOffset: 1000 });
  
  // Set up location queue callbacks
  setupQueueIntegration();
  
  // Adjust initial zoom level
  map.setZoom(6);
  
  // Customize Leaflet popups
  customizeLeafletPopup();
}

// Set up queue integration
function setupQueueIntegration() {
  console.log('Setting up queue integration');
  
  // Set callback for when a new location is selected from the queue
  window.locationQueue.onLocationSelected((locationData) => {
    console.log(`Location selected callback triggered for: ${locationData.place}`);
    
    if (!animationInProgress) {
      console.log(`Starting navigation to ${locationData.place}`);
      // If we're not currently animating, start navigation
      navigateToQueuedLocation(locationData.place);
    } else {
      console.log(`Cannot navigate to ${locationData.place} - animation in progress`);
    }
  });
  
  // Set callback for when animation is complete
  window.locationQueue.onAnimationComplete(() => {
    console.log('Animation complete callback triggered');
  });
}

// Navigate to a location from the queue
async function navigateToQueuedLocation(placeName) {
  console.log(`Starting navigation to queued location: ${placeName}`);
  
  if (animationInProgress) {
    console.log('Animation already in progress, ignoring request');
    return;
  }
  
  try {
    // Play request sound
    if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
      window.SoundSystem.play('request');
    }
    
    showNotification(`Exploring ${placeName} ✈️`, 'info');
    
    // Call geocoding API to get coordinates
    console.log(`Geocoding location: ${placeName}`);
    const response = await fetch(`/api/geocode?place=${encodeURIComponent(placeName)}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`Geocoding successful for ${placeName}:`, data);
      // If geocoding is successful
      const destination = { lat: data.lat, lng: data.lon };
      // Store destination name
      currentDestination = placeName;
      
      // Remove previous markers and routes
      if (destinationMarker) map.removeLayer(destinationMarker);
      if (pastRouteLine) map.removeLayer(pastRouteLine);
      if (futureRouteLine) map.removeLayer(futureRouteLine);
      if (airplaneMarker && map.hasLayer(airplaneMarker)) map.removeLayer(airplaneMarker);
      if (distanceLabel) map.removeLayer(distanceLabel);
      if (remainingDistanceLabel) map.removeLayer(remainingDistanceLabel);
      
      // Add marker for destination
      const destinationIcon = createMarkerIcon('lavender');
      
      destinationMarker = L.marker([destination.lat, destination.lng], {
        icon: destinationIcon
      }).addTo(map)
        .bindPopup(createCustomPopup(`📍 ${placeName}`))
        .openPopup();
      
      // Calculate distance between start and destination
      totalDistance = calculateDistance(
        currentPosition.lat, 
        currentPosition.lng, 
        destination.lat, 
        destination.lng
      );
      
      console.log(`Distance to ${placeName}: ${totalDistance.toFixed(2)} km`);
      
      // Draw dashed line between start and destination (future route)
      futureRouteLine = L.polyline([[currentPosition.lat, currentPosition.lng], [destination.lat, destination.lng]], {
        color: pastelColors.lavender,
        weight: 5,
        opacity: 0.8,
        dashArray: '12, 8'
      }).addTo(map);
      
      // Create past route line (empty initially)
      pastRouteLine = L.polyline([], {
        color: pastelColors.peach,
        weight: 5,
        opacity: 0.7
      }).addTo(map);
      
      // Add label showing total distance at the middle of the route
      const middlePoint = L.latLng(
        (currentPosition.lat + destination.lat) / 2,
        (currentPosition.lng + destination.lng) / 2
      );
      
      distanceLabel = L.marker(middlePoint, {
        icon: L.divIcon({
          html: createDistanceLabel(totalDistance),
          className: '',
          iconSize: [200, 30],
          iconAnchor: [100, 15]
        }),
        interactive: false
      }).addTo(map);
      
      // Fit the map to show the entire route
      map.fitBounds(futureRouteLine.getBounds(), { padding: [70, 70] });
      
      // Reset camera control variables
      cameraFollow = true;
      zoomOutTriggered = false;
      
      // Play transition sound
      if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
        window.SoundSystem.play('transition');
      }
      
      console.log(`Starting airplane animation to ${placeName}`);
      // Start airplane animation
      animateAirplane(currentPosition, destination);
    } else {
      console.error(`Geocoding failed for ${placeName}:`, data.error);
      showNotification(data.error || 'Could not find this location 😢', 'error');
    }
  } catch (error) {
    console.error('Error navigating:', error);
    showNotification('Error navigating to location 😢', 'error');
  }
}

// Customize Leaflet popups
function customizeLeafletPopup() {
  // Add CSS for popups
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .leaflet-popup-content-wrapper {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      border: 3px solid ${pastelColors.primary};
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .leaflet-popup-tip {
      background: ${pastelColors.primary};
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .leaflet-popup-content {
      margin: 13px 19px;
      line-height: 1.4;
      font-family: 'Quicksand', sans-serif;
      font-size: 14px;
      color: #7c6c77;
    }
    .custom-popup {
      display: flex;
      align-items: center;
      padding: 5px;
    }
    .custom-popup-icon {
      margin-right: 8px;
      font-size: 18px;
    }
    .custom-popup-text {
      font-weight: 600;
    }
    .distance-label {
      background-color: rgba(255, 255, 255, 0.9);
      border: 2px solid ${pastelColors.accent};
      border-radius: 15px;
      padding: 5px 10px;
      font-family: 'Quicksand', sans-serif;
      font-weight: 600;
      font-size: 13px;
      color: #7c6c77;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .remaining-distance {
      background-color: rgba(255, 255, 255, 0.9);
      border: 2px solid ${pastelColors.mint};
      border-radius: 15px;
      padding: 5px 10px;
      font-family: 'Quicksand', sans-serif;
      font-weight: 600;
      font-size: 13px;
      color: #7c6c77;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      z-index: 1000;
    }
    .remaining-distance-icon {
      margin-right: 5px;
      font-size: 16px;
    }
  `;
  document.head.appendChild(styleTag);
}

// Create custom popup content
function createCustomPopup(text) {
  return `
    <div class="custom-popup">
      <div class="custom-popup-text">${text}</div>
    </div>
  `;
}

// Create airplane icon
function createAirplaneIcon(angle) {
  return L.divIcon({
    html: `
      <div class="airplane-container animate-float">
        <div class="pulse-circle"></div>
        <svg class="airplane-icon" viewBox="0 0 24 24" fill="${pastelColors.primary}" style="transform: rotate(${angle}deg); filter: drop-shadow(0 0 3px #fff) drop-shadow(0 0 5px rgba(0,0,0,0.2));">
          <path d="M21,16V14L13,9V3.5A1.5,1.5,0,0,0,11.5,2h0A1.5,1.5,0,0,0,10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5Z" stroke="#fff" stroke-width="0.8" />
        </svg>
      </div>
    `,
    className: '',
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });
}

// Create marker icon with specified color
function createMarkerIcon(colorType) {
  let markerColor = pastelColors.primary; // Default to pink
  
  switch(colorType) {
    case 'primary':
      markerColor = pastelColors.primary;
      break;
    case 'secondary':
      markerColor = pastelColors.secondary;
      break;
    case 'accent':
      markerColor = pastelColors.accent;
      break;
    case 'mint':
      markerColor = pastelColors.mint;
      break;
    case 'lavender':
      markerColor = pastelColors.lavender;
      break;
    case 'peach':
      markerColor = pastelColors.peach;
      break;
  }
  
  // Create a cute marker icon
  return L.divIcon({
    html: `
      <div class="animate-pulse" style="width: 45px; height: 45px; position: relative;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="45" height="45">
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="glow"/>
            <feComposite in="SourceGraphic" in2="glow" operator="over"/>
          </filter>
          <path fill="${markerColor}" stroke="#fff" stroke-width="1" filter="url(#glow)" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
        </svg>
        <div style="position: absolute; top: -5px; right: -5px; background-color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <span style="font-size: 12px;">📍</span>
        </div>
      </div>
    `,
    className: '',
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -45]
  });
}

// Calculate distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

// Create distance label
function createDistanceLabel(distance) {
  return `<div class="distance-label">🛣️ Distance: ${distance.toFixed(1)} km</div>`;
}

// Create remaining distance label
function createRemainingDistanceLabel(distance) {
  return `<div class="remaining-distance">
    <span class="remaining-distance-icon">🛬</span>
    <span>Remaining: ${distance.toFixed(1)} km</span>
  </div>`;
}

// Animate airplane movement between two points
function animateAirplane(start, end) {
  animationInProgress = true;
  
  // Animation duration - 5 seconds
  const totalDuration = 5000;
  
  // Function to interpolate between two values
  function interpolate(start, end, fraction) {
    return start + (end - start) * fraction;
  }
  
  // Calculate angle for airplane rotation (in degrees)
  function calculateAngle(startLat, startLng, endLat, endLng) {
    const dLng = (endLng - startLng) * Math.PI / 180;
    const startLatRad = startLat * Math.PI / 180;
    const endLatRad = endLat * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(endLatRad);
    const x = Math.cos(startLatRad) * Math.sin(endLatRad) - 
             Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng);
    
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    // Adjust angle for map display
    angle = (angle + 360) % 360;
    return angle;
  }
  
  // Calculate rotation angle
  const angle = calculateAngle(
    start.lat, 
    start.lng, 
    end.lat, 
    end.lng
  );
  
  // Initialize airplane position
  const initialPos = [start.lat, start.lng];
  
  // Create rotated airplane icon
  const rotatedIcon = createAirplaneIcon(angle);
  airplaneMarker.setIcon(rotatedIcon);
  airplaneMarker.setLatLng(initialPos);
  
  // Add airplane to map
  airplaneMarker.addTo(map);
  
  // Start animation time
  const startTime = Date.now();
  
  // Add remaining distance label
  remainingDistanceLabel = L.marker([0, 0], {
    icon: L.divIcon({
      html: createRemainingDistanceLabel(totalDistance),
      className: '',
      iconSize: [150, 30],
      iconAnchor: [75, 40]
    }),
    interactive: false
  }).addTo(map);
  
  // Animation frame function
  function moveStep() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const fraction = Math.min(elapsedTime / totalDuration, 1); // Value between 0-1
    
    if (fraction < 1) {
      // Calculate current position
      const lat = interpolate(start.lat, end.lat, fraction);
      const lng = interpolate(start.lng, end.lng, fraction);
      
      // Update airplane position
      airplaneMarker.setLatLng([lat, lng]);
      
      // Calculate remaining distance
      const remainingDistance = totalDistance * (1 - fraction);
      
      // Update remaining distance label to follow airplane
      remainingDistanceLabel.setLatLng([lat, lng]);
      remainingDistanceLabel.setIcon(L.divIcon({
        html: createRemainingDistanceLabel(remainingDistance),
        className: '',
        iconSize: [150, 30],
        iconAnchor: [75, 40]
      }));
      
      // If camera follow is enabled, center map on airplane
      map.panTo([lat, lng]);
      
      // Update past route
      const pastCoords = [
        [start.lat, start.lng],
        [lat, lng]
      ];
      pastRouteLine.setLatLngs(pastCoords);
      
      // Update future route
      const futureCoords = [
        [lat, lng],
        [end.lat, end.lng]
      ];
      futureRouteLine.setLatLngs(futureCoords);
      
      // Continue animation in next frame
      requestAnimationFrame(moveStep);
    } else {
      // Animation complete
      
      // Remove remaining distance label
      if (remainingDistanceLabel) {
        map.removeLayer(remainingDistanceLabel);
      }
      
      // Play celebration sound
      if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
        window.SoundSystem.play('celebration');
      }
      
      // Add arrival effect
      const arrivalEffect = L.divIcon({
        html: `
          <div class="arrival-effect" style="
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(224, 195, 252, 0.9) 0%, rgba(224, 195, 252, 0) 70%);
            animation: expand 1.2s ease-out forwards;
            position: absolute;
            top: -75px;
            left: -75px;
          "></div>
          <div style="position: absolute; top: -20px; left: 0; width: 100%; text-align: center; font-size: 28px; animation: pop 0.5s forwards;">🎯</div>
        `,
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      
      const effectMarker = L.marker([end.lat, end.lng], { icon: arrivalEffect }).addTo(map);
      
      // Remove effect after 1.2 seconds
      setTimeout(() => {
        map.removeLayer(effectMarker);
      }, 1200);
      
      // Remove routes and airplane
      if (pastRouteLine) map.removeLayer(pastRouteLine);
      if (futureRouteLine) map.removeLayer(futureRouteLine);
      if (distanceLabel) map.removeLayer(distanceLabel);
      map.removeLayer(airplaneMarker);
      
      // Two-step zoom for better effect
      setTimeout(() => {
        // Step 1: Zoom to city level
        map.flyTo([end.lat, end.lng], 14, {
          duration: 1.5
        });
        
        // Wait for first zoom to complete
        map.once('moveend', function() {
          // Step 2: Zoom to street level
          map.flyTo([end.lat, end.lng], 17, {
            duration: 1.5
          });
          
          // Wait for second zoom to complete
          map.once('moveend', function() {
            setTimeout(() => {
              // Update current position
              currentPosition = end;
              if (currentMarker) map.removeLayer(currentMarker);
              currentMarker = destinationMarker;
              
              // Show rating modal
              console.log('Opening rating modal for:', currentDestination, end.lat, end.lng);
              openRatingModal(currentDestination, end.lat, end.lng);
              
              // Animation complete
              animationInProgress = false;
            }, 500);
          });
        });
      }, 200);
    }
  }
  
  // Start animation
  moveStep();
}

// Show notification
function showNotification(message, type = 'success', animate = false) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  
  // Set color based on notification type
  switch(type) {
    case 'error':
      notification.style.background = pastelColors.primary; // Pink
      notification.style.color = '#a24857';
      break;
    case 'warning':
      notification.style.background = pastelColors.accent; // Light Yellow
      notification.style.color = '#8c7800';
      break;
    case 'info':
      notification.style.background = pastelColors.secondary; // Light Blue
      notification.style.color = '#336b72';
      break;
    case 'success':
    default:
      notification.style.background = pastelColors.mint; // Mint Green
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

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', initMap);
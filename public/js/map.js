/**
 * map.js - จัดการแผนที่และการเคลื่อนที่ของเครื่องบิน
 * Map Explorer PRO - Pastel Cute Theme
 */

// ตัวแปรแผนที่และองค์ประกอบต่างๆ
// ไม่ต้องประกาศ map ที่นี่เพราะประกาศใน index.html แล้ว
// let map;
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

// ตัวแปรควบคุมการเคลื่อนที่ของกล้อง
let cameraFollow = true;
let zoomOutTriggered = false;

// สีสำหรับธีม Pastel แบบเด่นชัดมากขึ้น
const pastelColors = {
  primary: '#FF78A9',  // สีชมพูสดขึ้น (เดิม: #ffb6c1)
  secondary: '#75C6E0',  // สีฟ้าเข้มขึ้น (เดิม: #a5dee5)
  accent: '#FFDA4A',    // สีเหลืองสดขึ้น (เดิม: #fdfd96)
  mint: '#80E8B6',     // สีเขียวมินต์สดขึ้น (เดิม: #b5ead7)
  lavender: '#C278FF',  // สีม่วงสดขึ้น (เดิม: #e0c3fc)
  peach: '#FFB26B'      // สีส้มพีชสดขึ้น (เดิม: #ffdab9)
};

// ฟังก์ชันสำหรับเริ่มต้นแผนที่
function initMap() {
  // สร้างแผนที่โดยใช้ Leaflet
  map = L.map('map', {
    zoomControl: false // ซ่อนปุ่ม zoom เริ่มต้น
  }).setView([currentPosition.lat, currentPosition.lng], 5);
  
  console.log('Map initialized');
  
  // เพิ่ม zoom control ในตำแหน่งด้านล่างขวา
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
  
  // เพิ่ม tile layer จาก OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // ปรับแต่ง CSS ของแผนที่ให้เข้ากับธีม Pastel
  document.querySelector('.leaflet-control-zoom').style.borderRadius = '20px';
  document.querySelector('.leaflet-control-zoom').style.overflow = 'hidden';
  document.querySelector('.leaflet-control-zoom').style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
  
  // เพิ่ม marker ของจุดเริ่มต้น
  const initialIcon = createMarkerIcon('primary');
  
  currentMarker = L.marker([currentPosition.lat, currentPosition.lng], {
    icon: initialIcon
  }).addTo(map)
    .bindPopup(createCustomPopup('🗼 Paris - จุดเริ่มต้น'))
    .openPopup();
  
  // สร้างไอคอนเครื่องบินแบบ PRO ด้วย SVG แบบน่ารัก
  const airplaneIcon = createAirplaneIcon(0);
  
  // สร้าง marker สำหรับเครื่องบิน (แต่ยังไม่แสดงบนแผนที่)
  airplaneMarker = L.marker([0, 0], { icon: airplaneIcon, zIndexOffset: 1000 });
  
  // เพิ่ม event listener สำหรับปุ่มนำทาง
  document.getElementById('navigate').addEventListener('click', navigateToDestination);
  
  // ปรับระดับซูมเริ่มต้นให้ใกล้มากขึ้น
  map.setZoom(6);
  
  // ปรับแต่ง popup ของ leaflet ให้สวยงามยิ่งขึ้น
  customizeLeafletPopup();
}

// ฟังก์ชันปรับแต่ง popup ของ leaflet
function customizeLeafletPopup() {
  // เพิ่ม CSS สำหรับ popup
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
      font-family: 'Mali', sans-serif;
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
      font-family: 'Mali', sans-serif;
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
      font-family: 'Mali', sans-serif;
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

// สร้าง custom popup content
function createCustomPopup(text) {
  const content = `
    <div class="custom-popup">
      <div class="custom-popup-text">${text}</div>
    </div>
  `;
  return content;
}

// ฟังก์ชันสร้างไอคอนเครื่องบิน
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
    iconSize: [50, 50],  // เพิ่มขนาดจาก 45 เป็น 50
    iconAnchor: [25, 25]  // ปรับ anchor ตาม iconSize
  });
}

// ฟังก์ชันสร้าง marker icon ด้วยสีที่กำหนด
function createMarkerIcon(colorType) {
  let markerColor = pastelColors.primary; // ค่าเริ่มต้นเป็นสีชมพู
  
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
  
  // สร้าง marker icon แบบน่ารักๆ ปรับให้เด่นชัดขึ้น
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

// ฟังก์ชันคำนวณระยะทางระหว่างสองจุดในหน่วย km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลกในหน่วย km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // ระยะทางในหน่วย km
  return distance;
}

// ฟังก์ชันสร้าง label แสดงระยะทาง
function createDistanceLabel(distance) {
  return `<div class="distance-label">🛣️ ระยะทาง: ${distance.toFixed(1)} กม.</div>`;
}

// ฟังก์ชันสร้าง label แสดงระยะทางที่เหลือ
function createRemainingDistanceLabel(distance) {
  return `<div class="remaining-distance">
    <span class="remaining-distance-icon">🛬</span>
    <span>เหลือ: ${distance.toFixed(1)} กม.</span>
  </div>`;
}

// ฟังก์ชันสำหรับการนำทางไปยังจุดหมาย
async function navigateToDestination() {
  const destinationInput = document.getElementById('destination').value;
  
  if (!destinationInput) {
    showNotification('กรุณากรอกชื่อสถานที่ปลายทาง 🌍', 'error');
    // เล่นเสียงแจ้งเตือนเมื่อมีข้อผิดพลาด
    try {
      if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
        window.SoundSystem.play('chime');
      } else {
        console.warn('SoundSystem not available or play method not found');
      }
    } catch (err) {
      console.error('Error playing sound:', err);
    }
    return;
  }
  
  if (animationInProgress) {
    showNotification('กำลังบินอยู่! รอให้เครื่องบินถึงที่หมายก่อนนะ ✈️', 'info', true);
    // เล่นเสียงแจ้งเตือนเมื่อมีข้อผิดพลาด
    try {
      if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
        window.SoundSystem.play('chime');
      }
    } catch (err) {
      console.error('Error playing sound:', err);
    }
    return;
  }
  
  try {
    // เล่นเสียงตอนกดปุ่มนำทาง
    try {
      if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
        window.SoundSystem.play('request');
      }
    } catch (err) {
      console.error('Error playing sound:', err);
    }
    
    // เปลี่ยนข้อความปุ่มเป็นกำลังโหลด
    const navigateBtn = document.getElementById('navigate');
    navigateBtn.innerHTML = '<div class="animate-spin" style="border:2px solid #fff;border-top-color:transparent;border-radius:50%;width:20px;height:20px;margin:0 auto;"></div>';
    navigateBtn.disabled = true;
    
    // เรียกใช้ API เพื่อค้นหาพิกัดของสถานที่
    const response = await fetch(`/api/geocode?place=${encodeURIComponent(destinationInput)}`);
    const data = await response.json();
    
    if (response.ok) {
      // ถ้าค้นหาพิกัดสำเร็จ
      const destination = { lat: data.lat, lng: data.lon };
      // เก็บชื่อปลายทางไว้
      currentDestination = destinationInput;
      
      // คืนค่าปุ่มกลับสู่สภาพปกติ
      navigateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.9,17.4L2.5,19L1,17.5L9.2,9.3L13.6,13.6L17.4,9.8C18.2,9 19.5,9 20.3,9.8C21.1,10.6 21.1,11.9 20.3,12.7L16.4,16.6L13,13.1L3.9,17.4Z"/>
        </svg>
        <span>ไปยังจุดหมาย</span>
      `;
      navigateBtn.disabled = false;
      
      // ลบ marker และเส้นทางเก่า (ถ้ามี)
      if (destinationMarker) map.removeLayer(destinationMarker);
      if (pastRouteLine) map.removeLayer(pastRouteLine);
      if (futureRouteLine) map.removeLayer(futureRouteLine);
      if (airplaneMarker && map.hasLayer(airplaneMarker)) map.removeLayer(airplaneMarker);
      if (distanceLabel) map.removeLayer(distanceLabel);
      if (remainingDistanceLabel) map.removeLayer(remainingDistanceLabel);
      
      // เพิ่ม marker สำหรับจุดหมาย
      const destinationIcon = createMarkerIcon('lavender');
      
      destinationMarker = L.marker([destination.lat, destination.lng], {
        icon: destinationIcon
      }).addTo(map)
        .bindPopup(createCustomPopup(`📍 ${destinationInput}`))
        .openPopup();
      
      // คำนวณระยะทางระหว่างจุดเริ่มต้นและจุดหมาย
      totalDistance = calculateDistance(
        currentPosition.lat, 
        currentPosition.lng, 
        destination.lat, 
        destination.lng
      );
      
      // วาดเส้นประระหว่างจุดเริ่มต้นกับจุดหมาย (เส้นที่ยังไม่ผ่าน)
      futureRouteLine = L.polyline([[currentPosition.lat, currentPosition.lng], [destination.lat, destination.lng]], {
        color: pastelColors.lavender,
        weight: 5,  // เพิ่มความหนาจาก 4 เป็น 5
        opacity: 0.8, // เพิ่มความทึบจาก 0.7 เป็น 0.8
        dashArray: '12, 8' // ปรับเส้นประให้ชัดขึ้น
      }).addTo(map);
      
      // สร้างเส้นทางที่ผ่านไปแล้ว (ยังไม่แสดง)
      pastRouteLine = L.polyline([], {
        color: pastelColors.peach,
        weight: 5,  // เพิ่มความหนาจาก 4 เป็น 5
        opacity: 0.7 // เพิ่มความทึบจาก 0.5 เป็น 0.7
      }).addTo(map);
      
      // เพิ่ม label แสดงระยะทาง ที่ตำแหน่งกึ่งกลางของเส้นทาง
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
      
      // ปรับ view ให้เห็นทั้งเส้นทาง
      map.fitBounds(futureRouteLine.getBounds(), { padding: [70, 70] });
      
      // รีเซ็ตตัวแปรควบคุมกล้อง
      cameraFollow = true;
      zoomOutTriggered = false;
      
      // เล่นเสียงเริ่มต้นการเดินทาง
      try {
        if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
          window.SoundSystem.play('transition');
        }
      } catch (err) {
        console.error('Error playing sound:', err);
      }
      
      // เริ่มต้นการเคลื่อนที่ของเครื่องบิน
      showNotification(`กำลังเดินทางไปยัง ${destinationInput} ✈️`, 'info');
      animateAirplane(currentPosition, destination);
    } else {
      // คืนค่าปุ่มกลับสู่สภาพปกติ
      navigateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.9,17.4L2.5,19L1,17.5L9.2,9.3L13.6,13.6L17.4,9.8C18.2,9 19.5,9 20.3,9.8C21.1,10.6 21.1,11.9 20.3,12.7L16.4,16.6L13,13.1L3.9,17.4Z"/>
        </svg>
        <span>ไปยังจุดหมาย</span>
      `;
      navigateBtn.disabled = false;
      
      showNotification(data.error || 'ไม่สามารถค้นหาสถานที่ได้ 😢', 'error');
    }
  } catch (error) {
    console.error('Error navigating:', error);
    
    // คืนค่าปุ่มกลับสู่สภาพปกติ
    const navigateBtn = document.getElementById('navigate');
    navigateBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.9,17.4L2.5,19L1,17.5L9.2,9.3L13.6,13.6L17.4,9.8C18.2,9 19.5,9 20.3,9.8C21.1,10.6 21.1,11.9 20.3,12.7L16.4,16.6L13,13.1L3.9,17.4Z"/>
      </svg>
      <span>ไปยังจุดหมาย</span>
    `;
    navigateBtn.disabled = false;
    
    showNotification('เกิดข้อผิดพลาดในการนำทาง 😢', 'error');
  }
}

// ฟังก์ชันสำหรับการเคลื่อนที่ของเครื่องบิน
function animateAirplane(start, end) {
  animationInProgress = true;
  
  // กำหนดเวลาในการเคลื่อนที่ 5 วินาที
  const totalDuration = 5000; // 5 วินาที
  
  // ฟังก์ชันสำหรับคำนวณตำแหน่งระหว่างสองจุด
  function interpolate(start, end, fraction) {
    return start + (end - start) * fraction;
  }
  
  // ฟังก์ชันสำหรับการคำนวณมุมของเครื่องบิน (องศา)
  function calculateAngle(startLat, startLng, endLat, endLng) {
    const dLng = (endLng - startLng) * Math.PI / 180;
    const startLatRad = startLat * Math.PI / 180;
    const endLatRad = endLat * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(endLatRad);
    const x = Math.cos(startLatRad) * Math.sin(endLatRad) - 
             Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng);
    
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    // ปรับมุมให้ถูกต้องสำหรับการแสดงบนแผนที่
    angle = (angle + 360) % 360;
    return angle;
  }
  
  // คำนวณมุมสำหรับหมุนเครื่องบิน
  const angle = calculateAngle(
    start.lat, 
    start.lng, 
    end.lat, 
    end.lng
  );
  
  // เริ่มตำแหน่งของเครื่องบิน
  const initialPos = [start.lat, start.lng];
  
  // สร้างไอคอนเครื่องบินที่มีการหมุนแล้ว
  const rotatedIcon = createAirplaneIcon(angle);
  airplaneMarker.setIcon(rotatedIcon);
  airplaneMarker.setLatLng(initialPos);
  
  // แสดงเครื่องบินบนแผนที่
  airplaneMarker.addTo(map);
  
  // เริ่มเวลาเคลื่อนที่
  const startTime = Date.now();
  
  // เพิ่ม label แสดงระยะทางที่เหลือ
  remainingDistanceLabel = L.marker([0, 0], {
    icon: L.divIcon({
      html: createRemainingDistanceLabel(totalDistance),
      className: '',
      iconSize: [150, 30],
      iconAnchor: [75, 40]
    }),
    interactive: false
  }).addTo(map);
  
  // ฟังก์ชันสำหรับการเคลื่อนที่ในแต่ละเฟรม
  function moveStep() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const fraction = Math.min(elapsedTime / totalDuration, 1); // ค่าระหว่าง 0-1
    
    if (fraction < 1) {
      // คำนวณตำแหน่งปัจจุบัน
      const lat = interpolate(start.lat, end.lat, fraction);
      const lng = interpolate(start.lng, end.lng, fraction);
      
      // อัพเดตตำแหน่งของเครื่องบิน
      airplaneMarker.setLatLng([lat, lng]);
      
      // คำนวณระยะทางที่เหลือ
      const remainingDistance = totalDistance * (1 - fraction);
      
      // อัพเดต label แสดงระยะทางที่เหลือ ให้ติดตามเครื่องบิน
      remainingDistanceLabel.setLatLng([lat, lng]);
      remainingDistanceLabel.setIcon(L.divIcon({
        html: createRemainingDistanceLabel(remainingDistance),
        className: '',
        iconSize: [150, 30],
        iconAnchor: [75, 40]
      }));
      
      // ถ้าการติดตามกล้องเปิดอยู่ ให้แผนที่ติดตามเครื่องบินตลอดเวลา
      map.panTo([lat, lng]);
      
      // อัพเดตเส้นทางที่ผ่านไปแล้ว
      const pastCoords = [
        [start.lat, start.lng],
        [lat, lng]
      ];
      pastRouteLine.setLatLngs(pastCoords);
      
      // อัพเดตเส้นทางที่ยังไม่ผ่าน
      const futureCoords = [
        [lat, lng],
        [end.lat, end.lng]
      ];
      futureRouteLine.setLatLngs(futureCoords);
      
      // ทำการเคลื่อนที่ต่อในเฟรมถัดไป
      requestAnimationFrame(moveStep);
    } else {
      // เมื่อการเคลื่อนที่เสร็จสิ้น
      
      // ลบ label แสดงระยะทางที่เหลือ
      if (remainingDistanceLabel) {
        map.removeLayer(remainingDistanceLabel);
      }
      
      // เล่นเสียงเมื่อถึงจุดหมาย
      try {
        if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
          window.SoundSystem.play('celebration');
        }
      } catch (err) {
        console.error('Error playing sound:', err);
      }
      
      // เพิ่มเอฟเฟกต์เมื่อถึงจุดหมาย
      // สร้างเอฟเฟกต์แสงระเบิดเมื่อถึงจุดหมาย
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
      
      // ลบเอฟเฟกต์หลังจาก 1.2 วินาที
      setTimeout(() => {
        map.removeLayer(effectMarker);
      }, 1200);
      
      // ลบเส้นทางทั้งหมดและเครื่องบิน
      if (pastRouteLine) map.removeLayer(pastRouteLine);
      if (futureRouteLine) map.removeLayer(futureRouteLine);
      if (distanceLabel) map.removeLayer(distanceLabel);
      map.removeLayer(airplaneMarker);
      
      // ซูมเข้าไปที่จุดหมายให้เห็นใกล้มากๆ
      // ใช้การซูมแบบ 2 ขั้นตอนเพื่อเอฟเฟกต์ที่ดีกว่า
      setTimeout(() => {
        // ขั้นที่ 1: ซูมเข้าไประดับเมือง
        map.flyTo([end.lat, end.lng], 14, {
          duration: 1.5
        });
        
        // รอให้ซูมแรกเสร็จ แล้วจึงซูมต่อ
        map.once('moveend', function() {
          // ขั้นที่ 2: ซูมเข้าไประดับถนนหรือตึก (ใกล้มากๆ)
          map.flyTo([end.lat, end.lng], 17, {
            duration: 1.5
          });
          
          // รอให้ซูมที่สองเสร็จ แล้วจึงแสดงกล่องคะแนน
          map.once('moveend', function() {
            setTimeout(() => {
              // อัพเดตตำแหน่งปัจจุบัน
              currentPosition = end;
              if (currentMarker) map.removeLayer(currentMarker);
              currentMarker = destinationMarker;
              
              // แสดงกล่องให้คะแนน
              console.log('Opening rating modal for:', currentDestination, end.lat, end.lng);
              openRatingModal(currentDestination, end.lat, end.lng);
              
              // สิ้นสุดการเคลื่อนที่
              animationInProgress = false;
            }, 500);
          });
        });
      }, 200);
    }
  }
  
  // เริ่มต้นการเคลื่อนที่
  moveStep();
}

// ฟังก์ชันแสดงการแจ้งเตือน
function showNotification(message, type = 'success', animate = false) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  
  // กำหนดสีตามประเภทการแจ้งเตือน
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
  
  // กำหนดข้อความ
  notificationMessage.textContent = message;
  
  // ถ้ากำหนดให้มีแอนิเมชัน
  if (animate) {
    notificationMessage.classList.add('animate-bounce');
    setTimeout(() => {
      notificationMessage.classList.remove('animate-bounce');
    }, 1000);
  }
  
  // แสดงการแจ้งเตือน
  notification.classList.add('active');
  
  // ซ่อนการแจ้งเตือนหลังจาก 3 วินาที
  setTimeout(() => {
    notification.classList.remove('active');
  }, 3000);
}

// เรียกใช้ฟังก์ชันเริ่มต้นแผนที่เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', initMap);
/**
 * rating.js - จัดการระบบการให้คะแนนสถานที่
 * Map Explorer PRO - Pastel Cute Version
 */

// ตัวแปรสำหรับระบบคะแนน
let ratingInProgress = false;
let finalScore = 0;
let currentRatingPlace = '';
let currentRatingLat = 0;
let currentRatingLng = 0;
let countInterval;
let autoCloseTimeout; // สำหรับการปิดอัตโนมัติ
let autoSaveTimeout; // สำหรับการบันทึกอัตโนมัติ

// ฟังก์ชันสร้างเอฟเฟกต์พลุและดาวระยิบ
function addConfettiEffect() {
  // สร้าง element สำหรับพลุและดาว
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  // สร้างดาวและพลุจำนวนหนึ่ง
  for (let i = 0; i < 40; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = getRandomColor();
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    if (Math.random() > 0.6) {
      // สร้างรูปดาว
      confetti.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15">
          <path fill="${getRandomColor()}" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
        </svg>
      `;
    } else if (Math.random() > 0.3) {
      // สร้างรูปหัวใจ
      confetti.innerHTML = `
        <svg viewBox="0 0 24 24" width="15" height="15">
          <path fill="${getRandomColor()}" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"/>
        </svg>
      `;
    } else {
      // สร้างรูปน่ารักอื่นๆ
      const emojis = ['🌟', '✨', '💖', '🎀', '🌈', '🦄', '🍭', '🌸'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.innerHTML = `<div style="font-size: 20px;">${randomEmoji}</div>`;
    }
    
    confettiContainer.appendChild(confetti);
    
    // สร้างแอนิเมชันสำหรับแต่ละชิ้น
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
    
    // ลบเมื่อแอนิเมชันจบ
    animation.onfinish = () => {
      confetti.remove();
      // ลบ container เมื่อไม่มี confetti เหลือ
      if (confettiContainer.children.length === 0) {
        confettiContainer.remove();
      }
    };
  }
}

// ฟังก์ชันสร้างสีสุ่ม - โทนพาสเทล
function getRandomColor() {
  const colors = [
    '#ffb6c1', // Pink
    '#a5dee5', // Light Blue
    '#fdfd96', // Light Yellow
    '#b5ead7', // Mint Green
    '#e0c3fc', // Lavender
    '#ffdab9', // Peach
    '#c9c3f7', // Light Purple
    '#ff9aa2', // Light Red
    '#ffdfba'  // Light Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ฟังก์ชันเปิดกล่องให้คะแนน
function openRatingModal(placeName, lat, lng) {
  console.log('Rating modal opened for:', placeName, lat, lng);
  
  // บันทึกข้อมูลสถานที่ที่จะให้คะแนน
  currentRatingPlace = placeName;
  currentRatingLat = lat;
  currentRatingLng = lng;
  
  // กำหนดชื่อสถานที่ในกล่องให้คะแนน
  document.getElementById('rating-place-name').textContent = placeName;
  
  // รีเซ็ตค่าตัวนับคะแนนและ progress bar
  document.getElementById('score-counter').textContent = '0';
  document.getElementById('score-counter').className = 'score-counter';
  document.getElementById('progress-fill').style.width = '0%';
  
  // หาตำแหน่งพิกัดของจุดหมายบนหน้าจอ
  const point = map.latLngToContainerPoint([lat, lng]);
  
  // ตั้งค่าตำแหน่งของโมดัลให้อยู่เหนือจุดหมาย
  const modal = document.getElementById('rating-modal');
  
  // แสดงโมดัลให้อยู่ตรงกลางหน้าจอก่อน แล้วจึงเลื่อนลงมาด้วยแอนิเมชัน
  const modalContent = document.querySelector('.modal-content');
  modalContent.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  modalContent.style.transform = 'translateY(-50px) scale(0.9)';
  
  // แสดงกล่องให้คะแนนด้วยแอนิเมชันน่ารัก
  modal.classList.add('active');
  
  // ทำแอนิเมชันเลื่อนเข้ามา
  setTimeout(() => {
    modalContent.style.transform = 'translateY(0) scale(1)';
  }, 100);
  
  // เพิ่มเอฟเฟกต์พลุและดาวระยิบเมื่อโมดัลปรากฏ
  addConfettiEffect();
  
  // เริ่มต้นการนับคะแนน
  setTimeout(() => {
    console.log('Starting score counting...');
    startCountingScore();
  }, 500);

  // ยกเลิก timeout เดิม (ถ้ามี)
  if (autoCloseTimeout) {
    clearTimeout(autoCloseTimeout);
  }
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
}

// ฟังก์ชันเริ่มนับคะแนน 1-100
function startCountingScore() {
  if (ratingInProgress) return;
  
  console.log('Rating in progress started...');
  ratingInProgress = true;
  let score = 0;
  const scoreCounter = document.getElementById('score-counter');
  const progressFill = document.getElementById('progress-fill');
  const message = document.querySelector('.rating-message');
  
  // สุ่มคะแนนสุดท้ายระหว่าง 1-100
  finalScore = Math.floor(Math.random() * 100) + 1;
  console.log('Final random score:', finalScore);
  
  // กำหนดความเร็วในการนับเพื่อให้ใช้เวลาประมาณ 3 วินาที
  const speed = 30; // milliseconds
  const step = 1;
  
  message.textContent = 'กำลังประเมินคะแนนของสถานที่...';
  
  // สร้างเสียงนับเลข (ใช้ Web Audio API)
  let audioContext;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {
    console.warn('Web Audio API not supported:', e);
  }
  
  // ฟังก์ชันสร้างเสียงบี๊บเมื่อนับเลข
  function createBeepSound(frequency, duration) {
    if (!audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = 0.05; // ลดความดังลงมากกว่าเดิม
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
      }, duration);
    } catch(e) {
      console.warn('Error creating beep sound:', e);
    }
  }
  
  // ใช้ setInterval เพื่อนับคะแนนขึ้นเรื่อยๆ
  countInterval = setInterval(() => {
    score += step;
    console.log('Current score:', score);
    
    // เล่นเสียงเมื่อนับเลข (ความถี่แตกต่างกันตามคะแนน)
    if (score % 5 === 0 && audioContext) {
      try {
        createBeepSound(300 + score * 2, 20);
      } catch(e) {
        console.warn('Error playing sound:', e);
      }
    }
    
    // อัพเดตตัวนับคะแนนและ progress bar
    scoreCounter.textContent = score;
    progressFill.style.width = `${score}%`;
    
    // ปรับสีของคะแนนตามระดับ
    if (score >= 80) {
      scoreCounter.className = 'score-counter high';
    } else if (score < 40) {
      scoreCounter.className = 'score-counter low';
    } else {
      scoreCounter.className = 'score-counter';
    }
    
    // ถ้าถึงคะแนนสุดท้าย ให้หยุดการนับ
    if (score >= finalScore) {
      clearInterval(countInterval);
      console.log('Final score reached:', finalScore);
      
      // เพิ่มเสียงเมื่อนับเสร็จ
      if (audioContext) {
        try {
          if (finalScore >= 80) {
            createBeepSound(800, 300);
            setTimeout(() => createBeepSound(1000, 500), 300);
          } else if (finalScore >= 40) {
            createBeepSound(600, 300);
          } else {
            createBeepSound(300, 300);
          }
        } catch(e) {
          console.warn('Error playing final sound:', e);
        }
      }
      
      // เพิ่ม effect เมื่อนับเสร็จ
      scoreCounter.classList.add('animate-bounce');
      
      // เพิ่มพลุสำหรับคะแนนสูง
      if (finalScore >= 80) {
        addConfettiEffect();
      }
      
      // อัพเดตข้อความตามระดับคะแนน
      if (finalScore >= 85) {
        message.textContent = '🌟 สถานที่นี้น่าทึ่งมาก! คะแนนสูงสุดยอด';
        message.style.color = '#b5ead7'; // Mint
      } else if (finalScore >= 70) {
        message.textContent = '✨ สถานที่นี้น่าไปเยี่ยมชมสุดๆ';
        message.style.color = '#a5dee5'; // Light Blue
      } else if (finalScore >= 55) {
        message.textContent = '🌈 สถานที่นี้น่าสนใจมาก';
        message.style.color = '#e0c3fc'; // Lavender
      } else if (finalScore >= 40) {
        message.textContent = '👍 สถานที่นี้น่าพอใจ';
        message.style.color = '#ffdab9'; // Peach
      } else {
        message.textContent = '🌱 สถานที่นี้มีความเรียบง่าย';
        message.style.color = '#ffb6c1'; // Pink
      }
      
      // จบการนับคะแนน
      ratingInProgress = false;
      
      // ทำการบันทึกคะแนนอัตโนมัติหลังจากนับเสร็จ 1 วินาที
      autoSaveTimeout = setTimeout(() => {
        saveRating(true);
      }, 1000);
      
      // ตั้งเวลาปิดอัตโนมัติ 5 วินาทีหลังจากนับเสร็จ
      autoCloseTimeout = setTimeout(() => {
        closeRatingModal();
      }, 5000);
    }
  }, speed);
}

// ฟังก์ชันปิดกล่องให้คะแนน
function closeRatingModal() {
  document.getElementById('rating-modal').classList.remove('active');
  
  // หยุดการนับถ้ายังนับอยู่
  if (countInterval) {
    clearInterval(countInterval);
    ratingInProgress = false;
  }
  
  // ยกเลิก timeout การปิดอัตโนมัติ
  if (autoCloseTimeout) {
    clearTimeout(autoCloseTimeout);
    autoCloseTimeout = null;
  }
  
  // ยกเลิก timeout การบันทึกอัตโนมัติ
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
}

// ฟังก์ชันบันทึกคะแนน
async function saveRating(isAutoSave = false) {
  try {
    // หากกำลังนับคะแนนอยู่ ให้รอจนนับเสร็จ
    if (ratingInProgress) {
      return;
    }
    
    // ส่งข้อมูลคะแนนไปยังเซิร์ฟเวอร์
    const response = await fetch('/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        place: currentRatingPlace,
        score: finalScore,
        lat: currentRatingLat,
        lng: currentRatingLng
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // แสดงการแจ้งเตือนว่าบันทึกสำเร็จ
      if (isAutoSave) {
        showNotification(`บันทึกคะแนน ${finalScore} สำหรับ ${currentRatingPlace} อัตโนมัติแล้ว ✨`, 'success');
      } else {
        showNotification(`บันทึกคะแนน ${finalScore} สำหรับ ${currentRatingPlace} เรียบร้อยแล้ว`, 'success');
      }
      
      // อัพเดต Leaderboard
      loadLeaderboard();
    } else {
      showNotification(data.error || 'เกิดข้อผิดพลาดในการบันทึกคะแนน', 'error');
    }
  } catch (error) {
    console.error('Error saving rating:', error);
    showNotification('เกิดข้อผิดพลาดในการบันทึกคะแนน', 'error');
  }
}

// ฟังก์ชันโหลดข้อมูล Top 5 สถานที่คะแนนสูงสุด
async function loadLeaderboard() {
  try {
    const response = await fetch('/api/ratings/top');
    const data = await response.json();
    
    if (response.ok) {
      // อัพเดตรายการสถานที่
      updateLeaderboardUI(data.topPlaces);
    } else {
      console.error('Error loading leaderboard:', data.error);
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

// ฟังก์ชันอัพเดต UI ของ Leaderboard
function updateLeaderboardUI(places) {
  const leaderboardList = document.getElementById('top-places');
  
  // ล้างรายการเดิม
  leaderboardList.innerHTML = '';
  
  // ถ้าไม่มีข้อมูล
  if (!places || places.length === 0) {
    leaderboardList.innerHTML = '<li class="no-places">ยังไม่มีสถานที่ในระบบ</li>';
    return;
  }
  
  // ไอคอนสำหรับแสดงอันดับพิเศษ
  const specialRankIcons = [
    '👑', // อันดับ 1
    '🥈', // อันดับ 2
    '🥉'  // อันดับ 3
  ];
  
  // สร้างรายการใหม่
  places.forEach((place, index) => {
    const rankClass = index < 3 ? `rank-${index + 1}` : '';
    
    const listItem = document.createElement('li');
    listItem.className = 'place-item animate-fade-in';
    listItem.style.animationDelay = `${index * 0.1}s`;
    
    // แยกชื่อเมืองและประเทศ/รายละเอียด (หากมี)
    let placeName = place.place;
    let placeLocation = '';
    
    // ตรวจสอบว่ามีเครื่องหมาย - หรือ , เพื่อแยกระหว่างชื่อเมืองและประเทศ
    if (place.place.includes(' - ')) {
      const parts = place.place.split(' - ');
      placeName = parts[0].trim();
      placeLocation = parts[1].trim();
    } else if (place.place.includes(', ')) {
      const parts = place.place.split(', ');
      placeName = parts[0].trim();
      placeLocation = parts.slice(1).join(', ').trim();
    }
    
    // สร้าง HTML สำหรับรายการ
    listItem.innerHTML = `
      <div class="place-rank ${rankClass}">
        ${index < 3 ? specialRankIcons[index] : index + 1}
      </div>
      <div class="place-info">
        <div class="place-name">${placeName}</div>
        ${placeLocation ? `<div class="place-location">${placeLocation}</div>` : ''}
        <div class="place-score">${place.score} คะแนน</div>
      </div>
    `;
    
    leaderboardList.appendChild(listItem);
  });
}

// แสดงการแจ้งเตือน
function showNotification(message, type = 'success', animate = false) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  
  // กำหนดสีตามประเภทการแจ้งเตือน แบบพาสเทล
  switch(type) {
    case 'error':
      notification.style.background = '#ffb6c1'; // Pink
      notification.style.color = '#a24857';
      break;
    case 'warning':
      notification.style.background = '#fdfd96'; // Light Yellow
      notification.style.color = '#8c7800';
      break;
    case 'info':
      notification.style.background = '#a5dee5'; // Light Blue
      notification.style.color = '#336b72';
      break;
    case 'success':
    default:
      notification.style.background = '#b5ead7'; // Mint Green
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

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing rating system...');
  
  // โหลดข้อมูล Leaderboard
  loadLeaderboard();
  
  // เพิ่ม event listener สำหรับปุ่มปิดกล่องให้คะแนน
  document.getElementById('close-rating').addEventListener('click', closeRatingModal);
  
  // เพิ่ม event listener สำหรับคลิกพื้นหลังเพื่อปิดกล่องให้คะแนน
  document.getElementById('rating-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('rating-modal')) {
      closeRatingModal();
    }
  });
});
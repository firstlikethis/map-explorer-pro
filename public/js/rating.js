// ฟังก์ชันสร้างเอฟเฟกต์พลุและดาวระยิบ
function addConfettiEffect() {
  // สร้าง element สำหรับพลุและดาว
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  // สร้างดาวและพลุจำนวนหนึ่ง
  for (let i = 0; i < 30; i++) {
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
      // สร้างวงกลม
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.borderRadius = '50%';
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
      duration: 1000 + Math.random() * 1000,
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

// ฟังก์ชันสร้างสีสุ่ม
function getRandomColor() {
  const colors = [
    '#f1c40f', // Yellow
    '#e74c3c', // Red
    '#3498db', // Blue
    '#2ecc71', // Green
    '#9b59b6', // Purple
    '#e67e22'  // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}/**
 * rating.js - จัดการระบบการให้คะแนนสถานที่
 * Map Explorer PRO
 */

// ตัวแปรสำหรับระบบคะแนน
let ratingInProgress = false;
let finalScore = 0;
let currentRatingPlace = '';
let currentRatingLat = 0;
let currentRatingLng = 0;
let countInterval;

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
  
  // ปิดปุ่มบันทึกคะแนน
  document.getElementById('save-rating').disabled = true;
  
  // หาตำแหน่งพิกัดของจุดหมายบนหน้าจอ
  const point = map.latLngToContainerPoint([lat, lng]);
  
  // ตั้งค่าตำแหน่งของโมดัลให้อยู่เหนือจุดหมาย
  const modal = document.getElementById('rating-modal');
  
  // คำนวณตำแหน่งเริ่มต้นของโมดัล (เหนือจุดหมาย)
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const modalWidth = 500; // ประมาณความกว้างของโมดัล
  const modalHeight = 400; // ประมาณความสูงของโมดัล
  
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
}

// ฟังก์ชันเริ่มนับคะแนน 1-100
function startCountingScore() {
  if (ratingInProgress) return;
  
  console.log('Rating in progress started...');
  ratingInProgress = true;
  let score = 0;
  const scoreCounter = document.getElementById('score-counter');
  const progressFill = document.getElementById('progress-fill');
  const saveBtn = document.getElementById('save-rating');
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
      
      gainNode.gain.value = 0.1; // ลดความดังลง
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
      
      // อัพเดตข้อความและเปิดใช้ปุ่มบันทึก
      if (finalScore >= 80) {
        message.textContent = '🌟 สถานที่นี้ได้คะแนนสูงมาก! น่าประทับใจ';
        message.style.color = '#2ecc71';
      } else if (finalScore >= 60) {
        message.textContent = '✨ สถานที่นี้ได้คะแนนดี';
        message.style.color = '#3498db';
      } else if (finalScore >= 40) {
        message.textContent = '👍 สถานที่นี้ได้คะแนนปานกลาง';
        message.style.color = '#f39c12';
      } else {
        message.textContent = '👌 สถานที่นี้ได้คะแนนค่อนข้างต่ำ';
        message.style.color = '#e74c3c';
      }
      
      // เปิดใช้ปุ่มบันทึกคะแนน
      saveBtn.disabled = false;
      saveBtn.classList.add('animate-pulse-button');
      
      // จบการนับคะแนน
      ratingInProgress = false;
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
}

// ฟังก์ชันบันทึกคะแนน
async function saveRating() {
  try {
    // เปลี่ยนข้อความปุ่มเป็นกำลังบันทึก
    const saveBtn = document.getElementById('save-rating');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="animate-spin" style="border:2px solid #fff;border-top-color:transparent;border-radius:50%;width:20px;height:20px;margin:0 auto;"></div>';
    saveBtn.disabled = true;
    
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
      showNotification(`บันทึกคะแนน ${finalScore} สำหรับ ${currentRatingPlace} เรียบร้อยแล้ว`);
      
      // อัพเดต Leaderboard
      loadLeaderboard();
      
      // ปิดกล่องให้คะแนน
      closeRatingModal();
    } else {
      // คืนค่าปุ่มกลับสู่สภาพปกติ
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
      
      showNotification(data.error || 'เกิดข้อผิดพลาดในการบันทึกคะแนน', 'error');
    }
  } catch (error) {
    console.error('Error saving rating:', error);
    
    // คืนค่าปุ่มกลับสู่สภาพปกติ
    const saveBtn = document.getElementById('save-rating');
    saveBtn.innerHTML = 'บันทึกคะแนน';
    saveBtn.disabled = false;
    
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
  
  // สร้างรายการใหม่
  places.forEach((place, index) => {
    const rankClass = index < 3 ? `rank-${index + 1}` : '';
    
    const listItem = document.createElement('li');
    listItem.className = 'place-item animate-fade-in';
    listItem.style.animationDelay = `${index * 0.1}s`;
    
    listItem.innerHTML = `
      <div class="place-rank ${rankClass}">${index + 1}</div>
      <div class="place-info">
        <div class="place-name">${place.place}</div>
        <div class="place-score">${place.score} คะแนน</div>
      </div>
    `;
    
    leaderboardList.appendChild(listItem);
  });
}

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, initializing rating system...');
  
  // โหลดข้อมูล Leaderboard
  loadLeaderboard();
  
  // เพิ่ม event listener สำหรับปุ่มปิดกล่องให้คะแนน
  document.getElementById('close-rating').addEventListener('click', closeRatingModal);
  
  // เพิ่ม event listener สำหรับปุ่มบันทึกคะแนน
  document.getElementById('save-rating').addEventListener('click', saveRating);
  
  // เพิ่ม event listener สำหรับคลิกพื้นหลังเพื่อปิดกล่องให้คะแนน
  document.getElementById('rating-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('rating-modal')) {
      closeRatingModal();
    }
  });
  
  // ทดสอบระบบคะแนน (สามารถปิดการใช้งานได้)
  // setTimeout(() => {
  //   openRatingModal('Test Location', 0, 0);
  // }, 2000);
});
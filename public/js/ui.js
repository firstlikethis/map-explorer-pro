/**
 * ui.js - จัดการส่วน UI ของแอปพลิเคชัน
 * Map Explorer PRO
 */

// ฟังก์ชันเปิด/ปิด Leaderboard
function toggleLeaderboard() {
  const leaderboardContainer = document.querySelector('.leaderboard-container');
  leaderboardContainer.classList.toggle('active');
  
  // โหลดข้อมูล Leaderboard ใหม่เมื่อเปิด
  if (leaderboardContainer.classList.contains('active')) {
    loadLeaderboard();
  }
}

// ฟังก์ชันปิด Leaderboard
function closeLeaderboard() {
  document.querySelector('.leaderboard-container').classList.remove('active');
}

// ฟังก์ชันที่ทำให้สามารถกดปุ่มด้วยการกด Enter เมื่ออยู่ในช่องค้นหา
function setupSearchEnterKey() {
  const searchInput = document.getElementById('destination');
  
  searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('navigate').click();
    }
  });
}

// ฟังก์ชันเพิ่มเอฟเฟกต์ hover บนปุ่ม
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

// เพิ่มคลาสเอฟเฟกต์เคลื่อนไหวเมื่อโหลดหน้าเว็บ
function addLoadingAnimations() {
  const controls = document.querySelector('.controls');
  controls.classList.add('animate-fade-in');
  
  // สร้างเอฟเฟกต์เรียงลำดับสำหรับองค์ประกอบย่อย
  const elements = [
    document.querySelector('.logo'),
    document.querySelector('.search-container input'),
    document.querySelector('.search-container button')
  ];
  
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('animate-fade-in');
    }, index * 200);
  });
  
  // เพิ่มเอฟเฟกต์สำหรับ leaderboard ที่โหลดเริ่มต้น
  const leaderboard = document.querySelector('.leaderboard');
  if (leaderboard) {
    leaderboard.classList.add('animate-fade-in');
  }
}

// สร้างเอฟเฟกต์เคลื่อนไหวสำหรับโลโก้
function setupLogoAnimation() {
  const logo = document.querySelector('.logo');
  
  logo.addEventListener('mouseenter', () => {
    const globeIcon = logo.querySelector('.globe-icon');
    globeIcon.classList.add('animate-spin');
    
    // เล่นเสียงเมื่อโลโก้หมุน
    try {
      if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
        window.SoundSystem.play('chime');
      } else {
        console.warn('SoundSystem not available or play method not found');
      }
    } catch (err) {
      console.error('Error playing logo sound:', err);
    }
    
    setTimeout(() => {
      globeIcon.classList.remove('animate-spin');
    }, 1000);
  });
}

// ฟังก์ชันเพิ่ม ripple effect เมื่อคลิกปุ่ม
function addRippleEffect() {
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; // ปรับความทึบเพิ่มขึ้น
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
  
  // เพิ่ม keyframe สำหรับ ripple effect ที่มีขนาดใหญ่ขึ้น
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

// ฟังก์ชันที่ทำให้กล่องควบคุมสามารถเลื่อนได้
function makeDraggable() {
  const controls = document.querySelector('.controls');
  const header = document.querySelector('.controls-header');
  
  let isDragging = false;
  let offsetX, offsetY;
  
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - controls.getBoundingClientRect().left;
    offsetY = e.clientY - controls.getBoundingClientRect().top;
    controls.style.cursor = 'grabbing';
    
    // เพิ่มเอฟเฟกต์เวลากำลังลาก
    controls.style.boxShadow = '0 15px 40px rgba(244, 143, 177, 0.25)';
    controls.style.transform = 'scale(1.02)';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      // คืนค่าเมื่อปล่อยเมาส์
      controls.style.cursor = 'default';
      controls.style.boxShadow = '';
      controls.style.transform = '';
      isDragging = false;
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      controls.style.left = (e.clientX - offsetX) + 'px';
      controls.style.top = (e.clientY - offsetY) + 'px';
      controls.style.right = 'auto';
    }
  });
}

// ฟังก์ชันอัพเดต Leaderboard พร้อมเอฟเฟกต์เสียง
function updateLeaderboard() {
  // เล่นเสียงเมื่อโหลด Leaderboard
  try {
    if (window.SoundSystem && typeof window.SoundSystem.play === 'function') {
      window.SoundSystem.play('chime');
    } else {
      console.warn('SoundSystem not available or play method not found');
    }
  } catch (err) {
    console.error('Error playing leaderboard sound:', err);
  }
  
  // แสดงเอฟเฟกต์การรีเฟรช
  const leaderboardContent = document.querySelector('.leaderboard-content');
  if (leaderboardContent) {
    leaderboardContent.style.opacity = '0.5';
    leaderboardContent.style.transform = 'scale(0.95)';
    setTimeout(() => {
      leaderboardContent.style.opacity = '1';
      leaderboardContent.style.transform = 'scale(1)';
    }, 300);
  }
  
  // โหลดข้อมูล Leaderboard
  loadLeaderboard();
  
  // แสดงการแจ้งเตือน
  showNotification('รีเฟรชอันดับล่าสุดแล้ว ✨', 'info');
}

// ฟังก์ชันแสดงการแจ้งเตือน
function showNotification(message, type = 'success', animate = false) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');
  
  // กำหนดสีตามประเภทการแจ้งเตือน แบบพาสเทลสดใส
  switch(type) {
    case 'error':
      notification.style.background = '#FF78A9'; // Pink สดขึ้น
      notification.style.color = '#a24857';
      break;
    case 'warning':
      notification.style.background = '#FFDA4A'; // Light Yellow สดขึ้น
      notification.style.color = '#8c7800';
      break;
    case 'info':
      notification.style.background = '#75C6E0'; // Light Blue สดขึ้น
      notification.style.color = '#336b72';
      break;
    case 'success':
    default:
      notification.style.background = '#80E8B6'; // Mint Green สดขึ้น
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

// ปรับความสูงของ Leaderboard ให้แสดงรายการทั้งหมดโดยไม่มี scrollbar
function adjustLeaderboardHeight() {
  const leaderboardContent = document.querySelector('.leaderboard-content');
  const topPlaces = document.getElementById('top-places');
  
  if (leaderboardContent && topPlaces) {
    // คำนวณความสูงที่เหมาะสมตามจำนวนรายการ
    const itemCount = topPlaces.children.length;
    if (itemCount === 0) {
      // ถ้าไม่มีรายการ
      leaderboardContent.style.padding = '20px';
      leaderboardContent.style.height = 'auto';
    } else {
      // ถ้ามีรายการ ปรับความสูงให้พอดี (ประมาณ 70px ต่อรายการ + พื้นที่ว่าง)
      leaderboardContent.style.height = 'auto';
      // ลบ scrollbar
      leaderboardContent.style.overflowY = 'visible';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded in ui.js');
  
  // เพิ่ม event listener สำหรับปุ่ม Leaderboard ให้เป็นการรีเฟรชแทน
  const toggleLeaderboardBtn = document.getElementById('toggle-leaderboard');
  if (toggleLeaderboardBtn) {
    toggleLeaderboardBtn.addEventListener('click', updateLeaderboard);
  } else {
    console.error('Toggle leaderboard button not found!');
  }
  
  // โหลด Leaderboard เมื่อเริ่มต้น
  updateLeaderboard();
  
  // ตั้งค่าการกด Enter สำหรับช่องค้นหา
  setupSearchEnterKey();
  
  // เพิ่มเอฟเฟกต์ให้กับปุ่ม
  addButtonEffects();
  
  // เพิ่มเอฟเฟกต์เคลื่อนไหวเมื่อโหลดหน้าเว็บ
  addLoadingAnimations();
  
  // ตั้งค่าเอฟเฟกต์เคลื่อนไหวสำหรับโลโก้
  setupLogoAnimation();
  
  // เพิ่ม ripple effect เมื่อคลิกปุ่ม
  addRippleEffect();
  
  // ทำให้กล่องควบคุมสามารถเลื่อนได้
  makeDraggable();
  
  // ปรับ Leaderboard ให้แสดงรายการทั้งหมดโดยไม่มี scrollbar
  adjustLeaderboardHeight();
  
  // ตั้งค่า MutationObserver สำหรับการปรับความสูงของ Leaderboard เมื่อมีการเปลี่ยนแปลง
  const observer = new MutationObserver(adjustLeaderboardHeight);
  const topPlaces = document.getElementById('top-places');
  if (topPlaces) {
    observer.observe(topPlaces, { childList: true, subtree: true });
  }
});
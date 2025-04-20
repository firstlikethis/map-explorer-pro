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
  }
  
  // สร้างเอฟเฟกต์เคลื่อนไหวสำหรับโลโก้
  function setupLogoAnimation() {
    const logo = document.querySelector('.logo');
    
    logo.addEventListener('mouseenter', () => {
      const globeIcon = logo.querySelector('.globe-icon');
      globeIcon.classList.add('animate-spin');
      
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
        const x = e.clientX - e.target.getBoundingClientRect().left;
        const y = e.clientY - e.target.getBoundingClientRect().top;
        
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
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
    
    // เพิ่ม keyframe สำหรับ ripple effect
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes ripple {
        0% {
          width: 0px;
          height: 0px;
          opacity: 0.5;
        }
        100% {
          width: 400px;
          height: 400px;
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
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      controls.style.cursor = 'default';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        controls.style.left = (e.clientX - offsetX) + 'px';
        controls.style.top = (e.clientY - offsetY) + 'px';
        controls.style.right = 'auto';
      }
    });
  }

  function updateLeaderboard() {
    loadLeaderboard();
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    // เพิ่ม event listener สำหรับปุ่ม Leaderboard ให้เป็นการรีเฟรชแทน
    document.getElementById('toggle-leaderboard').addEventListener('click', updateLeaderboard);
    
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
  });
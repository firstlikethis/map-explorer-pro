/**
 * sound.js - จัดการระบบเสียงของแอปพลิเคชัน
 * Map Explorer PRO - Pastel Cute Theme
 */

// ตัวแปรควบคุมระบบเสียง
let isSoundEnabled = true;
let isMusicPlaying = false;
let musicVolume = 0.4; // 40%
let effectsVolume = 0.6; // 60%

// ตัวแปรอ้างอิงไฟล์เสียงต่างๆ
let backgroundMusic;
let soundEffects = {};

// ฟังก์ชันสำหรับโหลดไฟล์เสียงทั้งหมด
function loadSounds() {
  console.log('Loading sound files...');
  
  // โหลดเพลงพื้นหลัง
  backgroundMusic = document.getElementById('background-music');
  
  // โหลดเสียงเอฟเฟกต์
  soundEffects = {
    celebration: document.getElementById('sound-celebration'),
    chime: document.getElementById('sound-chime'),
    highRating: document.getElementById('sound-high-rating'),
    rating: document.getElementById('sound-rating'),
    request: document.getElementById('sound-request'),
    transition: document.getElementById('sound-transition')
  };
  
  // ตรวจสอบว่าโหลดไฟล์เสียงสำเร็จหรือไม่
  let allSoundsLoaded = true;
  
  if (!backgroundMusic) {
    console.error('Background music element not found!');
    allSoundsLoaded = false;
  }
  
  for (const soundName in soundEffects) {
    if (!soundEffects[soundName]) {
      console.error(`Sound effect "${soundName}" element not found!`);
      allSoundsLoaded = false;
    }
  }
  
  if (allSoundsLoaded) {
    console.log('All sound files loaded successfully');
  } else {
    console.warn('Some sound files could not be loaded');
  }
  
  return allSoundsLoaded;
}

// ฟังก์ชันเริ่มต้นระบบเสียง
function initSoundSystem() {
  console.log('Initializing sound system...');
  
  // โหลดไฟล์เสียงทั้งหมด
  if (!loadSounds()) {
    console.error('Failed to initialize sound system due to missing sound files');
    return;
  }
  
  // ตั้งค่าความดังเริ่มต้น
  setMusicVolume(musicVolume);
  setEffectsVolume(effectsVolume);
  
  // เพิ่ม event listener สำหรับปุ่มเปิด/ปิดเสียง
  const toggleSoundBtn = document.getElementById('toggle-sound');
  if (toggleSoundBtn) {
    toggleSoundBtn.addEventListener('click', toggleSound);
    
    // เปิดแผงควบคุมความดังเมื่อดับเบิลคลิกที่ปุ่มเสียง
    toggleSoundBtn.addEventListener('dblclick', toggleVolumePanel);
  } else {
    console.error('Toggle sound button not found!');
  }
  
  // เพิ่ม event listener สำหรับตัวปรับความดัง
  const musicVolumeSlider = document.getElementById('music-volume');
  const effectsVolumeSlider = document.getElementById('effects-volume');
  
  if (musicVolumeSlider) {
    musicVolumeSlider.addEventListener('input', (e) => {
      setMusicVolume(e.target.value / 100);
    });
  } else {
    console.error('Music volume slider not found!');
  }
  
  if (effectsVolumeSlider) {
    effectsVolumeSlider.addEventListener('input', (e) => {
      setEffectsVolume(e.target.value / 100);
    });
  } else {
    console.error('Effects volume slider not found!');
  }
  
  // เมื่อคลิกที่พื้นที่อื่นให้ปิดแผงควบคุมความดัง
  document.addEventListener('click', (e) => {
    const volumePanel = document.getElementById('volume-control');
    const toggleSoundBtn = document.getElementById('toggle-sound');
    
    if (volumePanel && volumePanel.classList.contains('active') && 
        e.target !== volumePanel && 
        !volumePanel.contains(e.target) && 
        e.target !== toggleSoundBtn && 
        !toggleSoundBtn.contains(e.target)) {
      volumePanel.classList.remove('active');
    }
  });
  
  // เริ่มเล่นเพลงพื้นหลังอัตโนมัติ
  playBackgroundMusic();
  
  console.log('Sound system initialized successfully');

  // ทดสอบเล่นเสียง (เพื่อการตรวจสอบ)
  setTimeout(() => {
    testSoundEffects();
  }, 2000);
}

// ฟังก์ชันทดสอบเสียงเอฟเฟกต์ (สำหรับตรวจสอบเท่านั้น)
function testSoundEffects() {
  console.log('Testing sound effects...');
  
  // ทดสอบเล่นเสียงแต่ละชนิด
  for (const soundName in soundEffects) {
    console.log(`Testing sound: ${soundName}`);
    try {
      playSound(soundName, true); // ส่ง true เพื่อบอกว่าเป็นการทดสอบ
    } catch (err) {
      console.error(`Error testing sound ${soundName}:`, err);
    }
  }
}

// ฟังก์ชันเปิด/ปิดเสียงทั้งหมด
function toggleSound() {
  isSoundEnabled = !isSoundEnabled;
  const soundBtn = document.getElementById('toggle-sound');
  
  if (!soundBtn) {
    console.error('Toggle sound button not found!');
    return;
  }
  
  const soundText = soundBtn.querySelector('span');
  
  if (isSoundEnabled) {
    playBackgroundMusic();
    soundBtn.classList.remove('muted');
    if (soundText) soundText.textContent = 'เปิดเสียง';
    showNotification('เปิดเสียงแล้ว 🎵', 'info');
  } else {
    pauseBackgroundMusic();
    soundBtn.classList.add('muted');
    if (soundText) soundText.textContent = 'ปิดเสียง';
    showNotification('ปิดเสียงแล้ว 🔇', 'info');
  }
}

// ฟังก์ชันเปิด/ปิดแผงควบคุมความดัง
function toggleVolumePanel() {
  const volumePanel = document.getElementById('volume-control');
  if (volumePanel) {
    volumePanel.classList.toggle('active');
  } else {
    console.error('Volume control panel not found!');
  }
}

// ฟังก์ชันตั้งค่าความดังของเพลงพื้นหลัง
function setMusicVolume(volume) {
  musicVolume = volume;
  if (backgroundMusic) {
    backgroundMusic.volume = volume;
    
    const musicVolumeSlider = document.getElementById('music-volume');
    if (musicVolumeSlider) {
      musicVolumeSlider.value = volume * 100;
    }
  }
}

// ฟังก์ชันตั้งค่าความดังของเอฟเฟกต์เสียง
function setEffectsVolume(volume) {
  effectsVolume = volume;
  
  // ตั้งค่าความดังให้กับทุกเอฟเฟกต์เสียง
  for (const sound in soundEffects) {
    if (soundEffects.hasOwnProperty(sound) && soundEffects[sound]) {
      soundEffects[sound].volume = volume;
    }
  }
  
  const effectsVolumeSlider = document.getElementById('effects-volume');
  if (effectsVolumeSlider) {
    effectsVolumeSlider.value = volume * 100;
  }
}

// ฟังก์ชันเล่นเพลงพื้นหลัง
function playBackgroundMusic() {
  if (!isSoundEnabled || !backgroundMusic) return;
  
  if (!isMusicPlaying) {
    backgroundMusic.volume = musicVolume;
    
    // ใช้ Promise เพื่อจัดการกับปัญหา autoplay policy
    const playPromise = backgroundMusic.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isMusicPlaying = true;
        console.log('Background music playing');
      })
      .catch(error => {
        console.warn('Autoplay prevented:', error);
        
        // เพิ่ม event listener สำหรับการคลิกครั้งแรกเพื่อเล่นเพลง
        document.addEventListener('click', function playOnFirstClick() {
          backgroundMusic.play()
            .then(() => {
              isMusicPlaying = true;
              console.log('Background music playing after user interaction');
            })
            .catch(err => console.error('Still could not play audio:', err));
          
          // ลบ event listener หลังจากใช้แล้ว
          document.removeEventListener('click', playOnFirstClick);
        }, { once: true });
      });
    }
  }
}

// ฟังก์ชันหยุดเพลงพื้นหลัง
function pauseBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
}

// ฟังก์ชันเล่นเสียงเอฟเฟกต์
function playSound(soundName, isTest = false) {
  if (!isSoundEnabled && !isTest) return;
  
  // ตรวจสอบว่ามีเสียงนี้หรือไม่
  if (soundEffects[soundName]) {
    const sound = soundEffects[soundName];
    if (!sound) {
      console.error(`Sound element for "${soundName}" is null or undefined`);
      return;
    }
    
    try {
      sound.volume = effectsVolume;
      
      // หยุดเสียงที่กำลังเล่นอยู่ (ถ้ามี) แล้วเล่นใหม่
      sound.pause();
      sound.currentTime = 0;
      
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error(`Error playing sound "${soundName}":`, err);
        });
      }
      
      if (isTest) {
        console.log(`Test sound "${soundName}" played successfully`);
      }
    } catch (err) {
      console.error(`Error playing sound "${soundName}":`, err);
    }
  } else {
    console.warn(`Sound "${soundName}" not found in soundEffects object`);
  }
}

// ฟังก์ชันแสดงการแจ้งเตือน (สำเนาจาก ui.js)
function showNotification(message, type = 'success', animate = false) {
  const notification = document.getElementById('notification');
  if (!notification) {
    console.error('Notification element not found!');
    return;
  }
  
  const notificationMessage = document.getElementById('notification-message');
  if (!notificationMessage) {
    console.error('Notification message element not found!');
    return;
  }
  
  // กำหนดสีตามประเภทการแจ้งเตือน
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

// นำระบบเสียงไปไว้ที่ global scope เพื่อให้เข้าถึงได้จากไฟล์อื่น
window.SoundSystem = {
  init: initSoundSystem,
  play: playSound,
  toggleSound: toggleSound,
  setMusicVolume: setMusicVolume,
  setEffectsVolume: setEffectsVolume
};

// เรียกใช้ฟังก์ชันเริ่มต้นระบบเสียงเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded in sound.js, initializing sound system...');
  setTimeout(initSoundSystem, 500); // รอให้ DOM โหลดเสร็จสมบูรณ์ก่อน
});
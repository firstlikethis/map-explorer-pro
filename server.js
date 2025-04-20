// server.js - เซิร์ฟเวอร์หลักสำหรับ Map Explorer PRO
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// ใช้ middleware สำหรับการรับค่า JSON และ static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// สร้างโฟลเดอร์ data ถ้ายังไม่มี
const dataPath = path.join(__dirname, 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

// ตรวจสอบและสร้างไฟล์ ratings.json ถ้ายังไม่มี
const ratingsPath = path.join(dataPath, 'ratings.json');
if (!fs.existsSync(ratingsPath)) {
  // สร้างไฟล์ใหม่พร้อมโครงสร้างเริ่มต้น
  const initialData = {
    places: []
  };
  fs.writeFileSync(ratingsPath, JSON.stringify(initialData, null, 2), 'utf8');
  console.log('Created new ratings.json file');
} else {
  // ตรวจสอบว่าไฟล์มีข้อมูลถูกต้องหรือไม่
  try {
    const testRead = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
    // ถ้าไม่มี places ให้เพิ่มเข้าไป
    if (!testRead.places) {
      testRead.places = [];
      fs.writeFileSync(ratingsPath, JSON.stringify(testRead, null, 2), 'utf8');
      console.log('Fixed ratings.json structure');
    }
  } catch (error) {
    // ถ้าไฟล์มีปัญหา ให้สร้างใหม่
    console.error('Error reading ratings.json, recreating file:', error);
    const initialData = {
      places: []
    };
    fs.writeFileSync(ratingsPath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

// API endpoint สำหรับค้นหาพิกัดของสถานที่
app.get('/api/geocode', async (req, res) => {
  try {
    const place = req.query.place;
    // ใช้ OpenStreetMap Nominatim API สำหรับการแปลงชื่อสถานที่เป็นพิกัด
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
    
    if (response.data && response.data.length > 0) {
      const location = {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name
      };
      res.json(location);
    } else {
      res.status(404).json({ error: 'ไม่พบสถานที่' });
    }
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นหาพิกัด' });
  }
});

// API endpoint สำหรับดึงข้อมูลคะแนนของสถานที่ทั้งหมด
app.get('/api/ratings', (req, res) => {
  try {
    const ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
    // ตรวจสอบว่ามี places อยู่หรือไม่
    if (!ratingsData.places) {
      ratingsData.places = [];
      fs.writeFileSync(ratingsPath, JSON.stringify(ratingsData, null, 2), 'utf8');
    }
    res.json(ratingsData);
  } catch (error) {
    console.error('Error reading ratings:', error);
    // ถ้าไฟล์มีปัญหา ให้สร้างใหม่และส่งข้อมูลเปล่า
    const initialData = {
      places: []
    };
    fs.writeFileSync(ratingsPath, JSON.stringify(initialData, null, 2), 'utf8');
    res.json(initialData);
  }
});

// API endpoint สำหรับบันทึกคะแนนของสถานที่
app.post('/api/ratings', (req, res) => {
  try {
    // อ่านข้อมูลคะแนนปัจจุบัน
    let ratingsData;
    try {
      ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
      // ตรวจสอบว่ามี places อยู่หรือไม่
      if (!ratingsData.places) {
        ratingsData.places = [];
      }
    } catch (readError) {
      console.error('Error reading ratings file, creating new data:', readError);
      ratingsData = { places: [] };
    }
    
    const { place, score, lat, lng } = req.body;
    
    if (!place || !score || !lat || !lng) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
    }
    
    // ตรวจสอบว่าสถานที่นี้มีในฐานข้อมูลแล้วหรือไม่
    const existingPlaceIndex = ratingsData.places.findIndex(p => 
      p.place.toLowerCase() === place.toLowerCase()
    );
    
    if (existingPlaceIndex !== -1) {
      // อัพเดตคะแนนถ้าสถานที่มีอยู่แล้ว
      ratingsData.places[existingPlaceIndex].score = score;
      ratingsData.places[existingPlaceIndex].visited = new Date().toISOString();
    } else {
      // เพิ่มสถานที่ใหม่
      ratingsData.places.push({
        place,
        score,
        lat,
        lng,
        visited: new Date().toISOString()
      });
    }
    
    // เรียงลำดับคะแนนจากมากไปน้อย
    ratingsData.places.sort((a, b) => b.score - a.score);
    
    // บันทึกลงไฟล์
    fs.writeFileSync(ratingsPath, JSON.stringify(ratingsData, null, 2), 'utf8');
    
    res.json({ success: true, message: 'บันทึกคะแนนเรียบร้อย', data: ratingsData });
  } catch (error) {
    console.error('Error saving rating:', error);
    // ถ้าเกิดข้อผิดพลาด ให้ส่งสถานะข้อผิดพลาด
    res.json({ success: false, message: 'มีปัญหาในการบันทึกคะแนน แต่คุณสามารถใช้งานต่อได้' });
  }
});

// API endpoint สำหรับดึงข้อมูล Top 5 สถานที่ที่มีคะแนนสูงสุด
app.get('/api/ratings/top', (req, res) => {
  try {
    const ratingsData = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
    // ตรวจสอบว่ามี places อยู่หรือไม่
    if (!ratingsData.places) {
      ratingsData.places = [];
      fs.writeFileSync(ratingsPath, JSON.stringify(ratingsData, null, 2), 'utf8');
    }
    
    // เรียงลำดับและส่งเฉพาะ 5 อันดับแรก
    const topPlaces = ratingsData.places
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    res.json({ topPlaces });
  } catch (error) {
    console.error('Error getting top ratings:', error);
    // ถ้าไฟล์มีปัญหา ให้ส่งข้อมูลเปล่า
    res.json({ topPlaces: [] });
  }
});

// หน้าหลัก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // ✅ SELECT SEMUA KOLOM YANG DIBUTUHKAN
    const query = `
      SELECT 
        id,
        title,
        type,
        address,
        price,
        price_unit,
        description,
        facilities,
        images,
        owner_name,
        owner_whatsapp,
        bedrooms,
        bathrooms,
        area,
        is_featured,
        views,
        whatsapp_clicks,
        created_at
      FROM properties
      WHERE status = 'available'
      ORDER BY is_featured DESC, created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    
    console.log('✅ Raw data from DB:', rows[0]); // Debug log
    
    const properties = rows.map(row => {
      // Extract city & district dari address
      const addressParts = row.address ? row.address.split(',').map(s => s.trim()) : [];
      const city = addressParts[addressParts.length - 1] || '';
      const district = addressParts.length > 1 ? addressParts[0] : addressParts[0] || '';
      
      // Parse JSON fields safely
      let facilities = [];
      let images = [];
      
      if (row.facilities) {
        try {
          facilities = JSON.parse(row.facilities);
        } catch (e) {
          console.error('❌ Error parsing facilities for id', row.id, ':', e);
        }
      }
      
      if (row.images) {
        try {
          images = JSON.parse(row.images);
        } catch (e) {
          console.error('❌ Error parsing images for id', row.id, ':', e);
        }
      }
      
      return {
        id: row.id,
        nama: row.title,
        type: row.type,
        alamat: row.address,
        city: city,
        district: district,
        harga: parseFloat(row.price),
        priceUnit: row.price_unit,
        description: row.description || '',
        facilities: facilities,
        images: images,
        ownerName: row.owner_name || '',
        whatsappNumber: row.owner_whatsapp || '',
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        area: row.area,
        isSponsored: row.is_featured === 1,
        views: row.views || 0,
        whatsappClicks: row.whatsapp_clicks || 0,
        createdAt: row.created_at
      };
    });
    
    console.log('✅ Transformed data:', properties[0]); // Debug log
    
    res.json(properties);
    
  } catch (error) {
    console.error('❌ Backend Error:', error);
    res.status(500).json({ 
      error: 'Gagal mengambil data',
      details: error.message 
    });
  }
});

export default router;
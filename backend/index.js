const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer'); // ✅ INSTALL DULU: npm install multer
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();

// CORS - biar frontend bisa akses
app.use(cors({
  origin: 'http://localhost:8080'
}));

app.use(express.json());

// ✅ SETUP FOLDER UPLOADS
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('📁 Folder uploads created');
}

// ✅ SERVE STATIC FILES (FOTO)
app.use('/uploads', express.static(uploadsDir));

// ✅ SETUP MULTER UNTUK UPLOAD FOTO
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed!'), false);
    }
  }
});

// Koneksi MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hunian-kita-db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database gagal:', err);
    return;
  }
  console.log('✅ MySQL Connected!');
});

// ========== API GET ALL PROPERTIES (PUBLIC) ==========
app.get('/api/rumah', (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.title as nama,
      COALESCE(LOWER(c.name), 'kost') as type,
      p.address as alamat,
      COALESCE(ct.name, 'Jakarta') as city,
      TRIM(SUBSTRING_INDEX(p.address, ',', 1)) as district,
      p.price as harga,
      COALESCE(p.price_unit, 'bulan') as priceUnit,
      COALESCE(p.description, '') as description,
      COALESCE(p.facilities, '[]') as facilities,
      COALESCE(p.image, '') as image,
      COALESCE(p.owner_name, 'Pemilik Properti') as ownerName,
      COALESCE(p.owner_whatsapp, '628123456789') as whatsappNumber,
      COALESCE(p.bedrooms, 1) as bedrooms,
      COALESCE(p.bathrooms, 1) as bathrooms,
      COALESCE(p.area, 20) as area,
      COALESCE(p.is_featured, 0) as isSponsored,
      COALESCE(p.views, 0) as views,
      COALESCE(p.whatsapp_clicks, 0) as whatsappClicks,
      p.created_at as createdAt
    FROM properties p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN cities ct ON p.city_id = ct.id
    WHERE p.status = 'available'
    ORDER BY p.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const formattedResults = results.map(row => {
      let facilities = [];
      if (row.facilities) {
        try {
          facilities = JSON.parse(row.facilities);
        } catch (e) {
          facilities = [];
        }
      }
      
      let images = [];
      if (row.image) {
        try {
          images = JSON.parse(row.image);
        } catch (e) {
          images = [row.image];
        }
      }
      
      return {
        id: row.id,
        nama: row.nama,
        type: row.type,
        alamat: row.alamat,
        city: row.city,
        district: row.district,
        harga: parseFloat(row.harga) || 0,
        priceUnit: row.priceUnit,
        description: row.description,
        facilities: facilities,
        images: images,
        ownerName: row.ownerName,
        whatsappNumber: row.whatsappNumber,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        area: row.area,
        isSponsored: row.isSponsored === 1,
        views: row.views,
        whatsappClicks: row.whatsappClicks,
        createdAt: row.createdAt
      };
    });
    
    console.log(`✅ Fetched ${formattedResults.length} properties`);
    res.json(formattedResults);
  });
});

// ========== API GET PROPERTY BY ID (DETAIL) ==========
app.get('/api/rumah/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      p.id,
      p.title as nama,
      COALESCE(LOWER(c.name), 'kost') as type,
      p.address as alamat,
      COALESCE(ct.name, 'Jakarta') as city,
      TRIM(SUBSTRING_INDEX(p.address, ',', 1)) as district,
      p.price as harga,
      COALESCE(p.price_unit, 'bulan') as priceUnit,
      COALESCE(p.description, '') as description,
      COALESCE(p.facilities, '[]') as facilities,
      COALESCE(p.image, '[]') as images,
      COALESCE(p.owner_name, 'Pemilik Properti') as ownerName,
      COALESCE(p.owner_whatsapp, '628123456789') as whatsappNumber,
      COALESCE(p.bedrooms, 1) as bedrooms,
      COALESCE(p.bathrooms, 1) as bathrooms,
      COALESCE(p.area, 20) as area,
      COALESCE(p.is_featured, 0) as isSponsored,
      COALESCE(p.views, 0) as views,
      COALESCE(p.whatsapp_clicks, 0) as whatsappClicks,
      p.created_at as createdAt,
      COALESCE(u.name, '') as uploaderName,
      COALESCE(u.role, '') as uploaderRole
    FROM properties p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN cities ct ON p.city_id = ct.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ? AND p.status = 'available'
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const row = results[0];
    
    let facilities = [];
    if (row.facilities) {
      try {
        facilities = JSON.parse(row.facilities);
      } catch (e) {
        facilities = [];
      }
    }
    
    let images = [];
    if (row.images) {
      try {
        images = JSON.parse(row.images);
      } catch (e) {
        images = [row.images];
      }
    }
    
    const property = {
      id: row.id,
      nama: row.nama,
      type: row.type,
      alamat: row.alamat,
      city: row.city,
      district: row.district,
      harga: parseFloat(row.harga) || 0,
      priceUnit: row.priceUnit,
      description: row.description,
      facilities: facilities,
      images: images,
      ownerName: row.ownerName,
      whatsappNumber: row.whatsappNumber,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      area: row.area,
      isSponsored: row.isSponsored === 1,
      views: row.views,
      whatsappClicks: row.whatsappClicks,
      createdAt: row.createdAt,
      uploaderName: row.uploaderName || '',
      uploaderRole: row.uploaderRole || ''
    };
    
    console.log('✅ Property detail fetched:', property.nama);
    res.json(property);
  });
});


// Endpoint untuk ambil semua cities
app.get('/api/cities', (req, res) => {
  const query = 'SELECT id, name, slug FROM cities ORDER BY name ASC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching cities:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching cities' 
      });
    }
    
    res.json(results);
  });
});




// ========== API LOGIN ==========
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Login attempt:', email);
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email dan password wajib diisi' 
    });
  }
  
  const sql = 'SELECT id, name, email, role, password FROM users WHERE email = ?';
  
  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan server' 
      });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }
    
    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }
    
    console.log(`✅ Login success: ${user.email} (${user.role})`);
    
    res.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

// ========== ✅ API UPLOAD PROPERTY (DENGAN FOTO) ==========
app.post('/api/properties', upload.array('images', 5), (req, res) => {
  console.log('📤 Upload property request');
  console.log('Body:', req.body);
  console.log('Files:', req.files?.length || 0, 'images');

  try {
    const {
      title,
      type,
      city,
      address,
      price,
      price_unit,
      description,
      facilities,
      owner_name,
      owner_whatsapp,
      bedrooms,
      bathrooms,
      area,
      user_id,
      category_id,
      city_id
    } = req.body;

    // Validasi
    if (!title || !type || !address || !price || !owner_name || !owner_whatsapp || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Field wajib tidak lengkap'
      });
    }

    // ✅ Process uploaded images
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Parse facilities
    let facilitiesArray = [];
    if (facilities) {
      try {
        facilitiesArray = typeof facilities === 'string' 
          ? JSON.parse(facilities) 
          : facilities;
      } catch (e) {
        facilitiesArray = [];
      }
    }

    // Determine category_id
    let finalCategoryId = category_id;
    if (!finalCategoryId) {
      const typeMap = { 'kost': 1, 'guesthouse': 2, 'villa': 3 };
      finalCategoryId = typeMap[type.toLowerCase()] || 1;
    }

    // Function untuk insert property setelah city_id sudah ditentukan
    const insertProperty = (finalCityId) => {
      const mainImage = imagePaths.length > 0 ? imagePaths[0] : '';
      const allImagesJson = JSON.stringify(imagePaths);
      const facilitiesJson = JSON.stringify(facilitiesArray);

      const sql = `
        INSERT INTO properties (
          user_id, title, category_id, city_id, address, price, price_unit,
          description, facilities, image, owner_name, owner_whatsapp, 
          bedrooms, bathrooms, area, status, views, whatsapp_clicks, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 0, 0, NOW())
      `;

      const values = [
        user_id,
        title,
        finalCategoryId,
        finalCityId,
        address,
        parseFloat(price),
        price_unit || 'bulan',
        description || '',
        facilitiesJson,
        allImagesJson,
        owner_name,
        owner_whatsapp,
        parseInt(bedrooms) || 1,
        parseInt(bathrooms) || 1,
        parseFloat(area) || 0
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error('❌ Insert error:', err);
          return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan properti',
            error: err.message
          });
        }

        console.log('✅ Property uploaded! ID:', result.insertId);
        res.json({
          success: true,
          message: 'Properti berhasil diupload',
          propertyId: result.insertId
        });
      });
    };

    // Determine city_id - cek dulu di database, jika tidak ada maka insert
    let finalCityId = city_id;
    if (!finalCityId && city) {
      // Cek apakah kota sudah ada di database
      const checkCitySql = 'SELECT id FROM cities WHERE LOWER(name) = LOWER(?) OR LOWER(slug) = LOWER(?)';
      const citySlug = city.toLowerCase().replace(/\s+/g, '-');
      
      db.query(checkCitySql, [city, citySlug], (err, cityResults) => {
        if (err) {
          console.error('❌ Error checking city:', err);
          return res.status(500).json({
            success: false,
            message: 'Gagal mengecek data kota',
            error: err.message
          });
        }
        
        if (cityResults.length > 0) {
          // Kota sudah ada, gunakan id-nya
          finalCityId = cityResults[0].id;
          console.log('✅ City found:', city, 'with ID:', finalCityId);
          insertProperty(finalCityId);
        } else {
          // Kota belum ada, insert dulu
          const insertCitySql = 'INSERT INTO cities (name, slug) VALUES (?, ?)';
          db.query(insertCitySql, [city, citySlug], (err, cityInsertResult) => {
            if (err) {
              console.error('❌ Error inserting city:', err);
              return res.status(500).json({
                success: false,
                message: 'Gagal menambahkan kota baru',
                error: err.message
              });
            }
            
            console.log('✅ City added:', city, 'with ID:', cityInsertResult.insertId);
            finalCityId = cityInsertResult.insertId;
            insertProperty(finalCityId);
          });
        }
      });
    } else if (finalCityId) {
      // city_id sudah ada dari parameter, langsung insert property
      insertProperty(finalCityId);
    } else {
      // Tidak ada city dan city_id, return error
      return res.status(400).json({
        success: false,
        message: 'Kota harus diisi'
      });
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
});

// ========== API GET PROPERTIES BY MITRA ==========
app.get('/api/properties/mitra/:userId', (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      p.id,
      p.title as nama,
      COALESCE(LOWER(c.name), 'kost') as type,
      p.address as alamat,
      COALESCE(ct.name, 'Jakarta') as city,
      TRIM(SUBSTRING_INDEX(p.address, ',', 1)) as district,
      p.price as harga,
      COALESCE(p.price_unit, 'bulan') as priceUnit,
      COALESCE(p.description, '') as description,
      COALESCE(p.facilities, '[]') as facilities,
      COALESCE(p.image, '[]') as images,
      COALESCE(p.owner_name, 'Pemilik Properti') as ownerName,
      COALESCE(p.owner_whatsapp, '628123456789') as whatsappNumber,
      COALESCE(p.bedrooms, 1) as bedrooms,
      COALESCE(p.bathrooms, 1) as bathrooms,
      COALESCE(p.area, 20) as area,
      COALESCE(p.is_featured, 0) as isSponsored,
      COALESCE(p.views, 0) as views,
      COALESCE(p.whatsapp_clicks, 0) as whatsappClicks,
      p.status,
      p.created_at as createdAt
    FROM properties p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN cities ct ON p.city_id = ct.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const formatted = results.map(row => {
      let facilities = [];
      try {
        facilities = JSON.parse(row.facilities);
      } catch (e) {
        facilities = [];
      }

      let images = [];
      try {
        images = JSON.parse(row.images);
      } catch (e) {
        images = [];
      }

      return {
        ...row,
        harga: parseFloat(row.harga) || 0,
        facilities,
        images
      };
    });

    console.log(`✅ Fetched ${formatted.length} properties for mitra ${userId}`);
    res.json(formatted);
  });
});

// ========== API DELETE PROPERTY ==========
app.delete('/api/properties/:id', (req, res) => {
  const { id } = req.params;

  // Get property to delete image files
  const selectSql = 'SELECT image FROM properties WHERE id = ?';
  
  db.query(selectSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Delete image files from disk
    if (results.length > 0 && results[0].image) {
      try {
        const images = JSON.parse(results[0].image);
        images.forEach(imagePath => {
          if (imagePath.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, imagePath);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log('🗑️ Deleted file:', filePath);
            }
          }
        });
      } catch (e) {
        console.error('Error deleting files:', e);
      }
    }

    // Delete from database
    const deleteSql = 'DELETE FROM properties WHERE id = ?';
    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      console.log(`✅ Property ${id} deleted`);
      res.json({ success: true, message: 'Properti berhasil dihapus' });
    });
  });
});

// Jalankan server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Uploads folder: ${uploadsDir}`);
  console.log(`🖼️  Images accessible at: http://localhost:${PORT}/uploads/`);
});
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

// ========== âœ… API UPLOAD PROPERTY (DENGAN VALIDASI TOKEN) ==========
app.post('/api/properties', upload.array('images', 5), (req, res) => {
  console.log('📤 Upload property request');
  console.log('Body:', req.body);
  console.log('Files:', req.files?.length || 0, 'images');

  try {
    const {
      title, type, city, address, price, price_unit, description,
      facilities, owner_name, owner_whatsapp, bedrooms, bathrooms,
      area, user_id, category_id, city_id
    } = req.body;

    // Validasi
    if (!title || !type || !address || !price || !owner_name || !owner_whatsapp || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Field wajib tidak lengkap'
      });
    }

    // ✅ CEK TOKEN USER SEBELUM UPLOAD
    const checkTokenSql = 'SELECT tokens, role FROM users WHERE id = ?';
    
    db.query(checkTokenSql, [user_id], (err, userResults) => {
      if (err) {
        console.error('❌ Error checking tokens:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengecek token'
        });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
      
      const userTokens = userResults[0].tokens;
      const userRole = userResults[0].role;
      
      // ✅ VALIDASI TOKEN (HANYA UNTUK MITRA)
      if (userRole === 'mitra' && userTokens < 15) {
        return res.status(403).json({
          success: false,
          message: `Token tidak mencukupi! Anda memiliki ${userTokens} token, dibutuhkan 15 token untuk upload properti.`
        });
      }
      
      // ✅ VALIDASI FOTO WAJIB ADA
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimal 1 foto harus diupload'
        });
      }

      // ✅ PROSES UPLOAD FOTO
      let imagePaths = [];
      if (req.files && req.files.length > 0) {
        imagePaths = req.files.map(file => `/uploads/${file.filename}`);
      }

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

      let finalCategoryId = category_id;
      if (!finalCategoryId) {
        const typeMap = { 'kost': 1, 'guesthouse': 2, 'villa': 3 };
        finalCategoryId = typeMap[type.toLowerCase()] || 1;
      }

      const insertProperty = (finalCityId) => {
        const facilitiesJson = JSON.stringify(facilitiesArray);

        // ✅ STEP 1: INSERT PROPERTI (TANPA KOLOM IMAGE)
        const sql = `
          INSERT INTO properties (
            user_id, title, type, category_id, city_id, address, price, price_unit,
            description, facilities, owner_name, owner_whatsapp, 
            bedrooms, bathrooms, area, status, views, whatsapp_clicks, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 0, 0, NOW())
        `;

        const values = [
          user_id, title, type.toLowerCase(), finalCategoryId, finalCityId,
          address, parseFloat(price), price_unit || 'bulan', description || '',
          facilitiesJson, owner_name, owner_whatsapp,
          parseInt(bedrooms) || 1, parseInt(bathrooms) || 1, parseFloat(area) || 0
        ];

        db.query(sql, values, (err, result) => {
          if (err) {
            console.error('❌ Insert property error:', err);
            return res.status(500).json({
              success: false,
              message: 'Gagal menyimpan properti',
              error: err.message
            });
          }

          const propertyId = result.insertId;

          // ✅ STEP 2: INSERT SEMUA FOTO KE TABEL IMAGES
          const imageInserts = imagePaths.map((path, index) => {
            return new Promise((resolve, reject) => {
              const insertImageSql = `
                INSERT INTO images (property_id, image_path, is_primary, display_order, created_at)
                VALUES (?, ?, ?, ?, NOW())
              `;
              const isPrimary = index === 0 ? 1 : 0; // Foto pertama jadi primary
              const displayOrder = index + 1;

              db.query(insertImageSql, [propertyId, path, isPrimary, displayOrder], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          });

          // ✅ JALANKAN SEMUA INSERT FOTO
          Promise.all(imageInserts)
            .then(() => {
              // ✅ KURANGI TOKEN SETELAH BERHASIL UPLOAD (HANYA UNTUK MITRA)
              if (userRole === 'mitra') {
                const updateTokenSql = 'UPDATE users SET tokens = tokens - 15 WHERE id = ?';
                db.query(updateTokenSql, [user_id], (err) => {
                  if (err) {
                    console.error('❌ Error updating tokens:', err);
                  } else {
                    console.log(`✅ Token reduced: User ${user_id} now has ${userTokens - 15} tokens`);
                  }
                });
              }

              console.log(`✅ Property uploaded! ID: ${propertyId}, Images: ${imagePaths.length}`);
              res.json({
                success: true,
                message: 'Properti berhasil diupload! Token Anda dikurangi 15.',
                propertyId: propertyId,
                remainingTokens: userRole === 'mitra' ? userTokens - 15 : null
              });
            })
            .catch(err => {
              console.error('❌ Error inserting images:', err);
              res.status(500).json({
                success: false,
                message: 'Properti tersimpan tapi gagal menyimpan foto',
                error: err.message
              });
            });
        });
      };

      // Logic untuk city_id (sama seperti sebelumnya)
      let finalCityId = city_id;
      if (!finalCityId && city) {
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
            finalCityId = cityResults[0].id;
            console.log('✅ City found:', city, 'with ID:', finalCityId);
            insertProperty(finalCityId);
          } else {
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
        insertProperty(finalCityId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Kota harus diisi'
        });
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
});

// ========== GET ALL PROPERTIES (ENDPOINT UTAMA) ==========
app.get('/api/rumah', (req, res) => {
  console.log('📥 Fetching all properties');

  const sql = `
    SELECT 
      p.*,
      c.name as city,
      cat.name as category_name,
      u.name as uploader_name,
      u.role as uploader_role,
      CASE 
        WHEN p.boosted_until > NOW() THEN 1 
        ELSE 0 
      END as is_boosted,
      CASE
        WHEN p.boosted_until > NOW() 
        THEN DATEDIFF(p.boosted_until, NOW())
        ELSE 0
      END as boost_days_remaining
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.status = 'available'
    ORDER BY 
      is_boosted DESC,
      p.created_at DESC
  `;

  db.query(sql, (err, propertiesResults) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (propertiesResults.length === 0) {
      return res.json([]);
    }

    const propertyIds = propertiesResults.map(p => p.id);
    const imagesSql = `
      SELECT property_id, image_path, is_primary, display_order
      FROM images 
      WHERE property_id IN (?)
      ORDER BY property_id, display_order
    `;

    db.query(imagesSql, [propertyIds], (err, imagesResults) => {
      if (err) {
        console.error('❌ Error fetching images:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const imagesMap = new Map();
      imagesResults.forEach(img => {
        if (!imagesMap.has(img.property_id)) {
          imagesMap.set(img.property_id, []);
        }
        imagesMap.get(img.property_id).push(img.image_path);
      });

      // ✅ RETURN ARRAY LANGSUNG (bukan object!)
      const properties = propertiesResults.map(row => ({
        id: row.id,
        nama: row.title,           // OLD format
        title: row.title,          // NEW format
        type: row.type,
        city: row.city,
        alamat: row.address,       // OLD format
        address: row.address,      // NEW format
        harga: row.price,          // OLD format
        price: row.price,          // NEW format
        priceUnit: row.price_unit, // OLD format
        price_unit: row.price_unit,// NEW format
        description: row.description,
        facilities: row.facilities,
        ownerName: row.owner_name,      // OLD format
        owner_name: row.owner_name,     // NEW format
        whatsappNumber: row.owner_whatsapp,  // OLD format
        owner_whatsapp: row.owner_whatsapp,  // NEW format
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        area: row.area,
        status: row.status,
        views: row.views,
        whatsappClicks: row.whatsapp_clicks,  // OLD format
        whatsapp_clicks: row.whatsapp_clicks, // NEW format
        createdAt: row.created_at,            // OLD format
        created_at: row.created_at,           // NEW format
        category_name: row.category_name,
        uploader_name: row.uploader_name,
        uploader_role: row.uploader_role,
        is_boosted: row.is_boosted,
        boost_days_remaining: row.boost_days_remaining,
        boosted_until: row.boosted_until,
        images: imagesMap.get(row.id) || []
      }));

      console.log(`✅ Returned ${properties.length} properties`);
      res.json(properties);  // ✅ ARRAY, bukan object!
    });
  });
});


// ========== BACKWARD COMPATIBILITY - /api/rumah ==========
// Endpoint ini untuk file lama yang masih pakai /api/rumah
app.get('/api/rumah', (req, res) => {
  console.log('⚠️ Using OLD endpoint: /api/rumah (backward compatibility)');
  
  // Copy-paste SEMUA ISI dari app.get('/api/properties') di atas
  // Atau redirect ke function yang sama
  const sql = `
    SELECT 
      p.*,
      c.name as city,
      cat.name as category_name,
      u.name as uploader_name,
      u.role as uploader_role,
      CASE 
        WHEN p.boosted_until > NOW() THEN 1 
        ELSE 0 
      END as is_boosted,
      CASE
        WHEN p.boosted_until > NOW() 
        THEN DATEDIFF(p.boosted_until, NOW())
        ELSE 0
      END as boost_days_remaining
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.status = 'available'
    ORDER BY 
      is_boosted DESC,
      p.created_at DESC
  `;

  db.query(sql, (err, propertiesResults) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (propertiesResults.length === 0) {
      return res.json([]);
    }

    const propertyIds = propertiesResults.map(p => p.id);
    const imagesSql = `
      SELECT property_id, image_path, is_primary, display_order
      FROM images 
      WHERE property_id IN (?)
      ORDER BY property_id, display_order
    `;

    db.query(imagesSql, [propertyIds], (err, imagesResults) => {
      if (err) {
        console.error('❌ Error fetching images:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const imagesMap = new Map();
      imagesResults.forEach(img => {
        if (!imagesMap.has(img.property_id)) {
          imagesMap.set(img.property_id, []);
        }
        imagesMap.get(img.property_id).push(img.image_path);
      });

      const properties = propertiesResults.map(row => ({
        id: row.id,
        nama: row.title,           // OLD format
        title: row.title,          // NEW format
        type: row.type,
        city: row.city,
        district: '',
        alamat: row.address,       // OLD format
        address: row.address,      // NEW format
        harga: row.price,          // OLD format
        price: row.price,          // NEW format
        priceUnit: row.price_unit, // OLD format
        price_unit: row.price_unit,// NEW format
        description: row.description,
        facilities: row.facilities,
        ownerName: row.owner_name,      // OLD format
        owner_name: row.owner_name,     // NEW format
        whatsappNumber: row.owner_whatsapp,  // OLD format
        owner_whatsapp: row.owner_whatsapp,  // NEW format
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        area: row.area,
        status: row.status,
        isSponsored: false,
        views: row.views,
        whatsappClicks: row.whatsapp_clicks,  // OLD format
        whatsapp_clicks: row.whatsapp_clicks, // NEW format
        createdAt: row.created_at,            // OLD format
        created_at: row.created_at,           // NEW format
        category_name: row.category_name,
        uploader_name: row.uploader_name,
        uploader_role: row.uploader_role,
        is_boosted: row.is_boosted,
        boost_days_remaining: row.boost_days_remaining,
        boosted_until: row.boosted_until,
        images: imagesMap.get(row.id) || []
      }));

      console.log(`✅ /api/rumah: Returned ${properties.length} properties`);
      res.json(properties);
    });
  });
});

// ========== API LOGIN (Updated with tokens) ==========
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 Login attempt:', email);
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email dan password wajib diisi' 
    });
  }
  
  // ✅ TAMBAHKAN tokens ke SELECT query
  const sql = 'SELECT id, name, email, role, is_active, tokens, password FROM users WHERE email = ?';
  
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
    
    // ✅ CEK APAKAH USER AKTIF (KECUALI ADMIN)
    if (user.role !== 'admin' && user.is_active === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Akun Anda telah dinonaktifkan.' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }
    
    console.log(`✅ Login success: ${user.email} (${user.role}) - Tokens: ${user.tokens}`);
    
    res.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tokens: user.tokens // ✅ KIRIM TOKEN KE FRONTEND
      }
    });
  });
});

// ========== âœ… API UPLOAD PROPERTY (DENGAN VALIDASI TOKEN) ==========
app.post('/api/properties', upload.array('images', 5), (req, res) => {
  console.log('📤 Upload property request');
  console.log('Body:', req.body);
  console.log('Files:', req.files?.length || 0, 'images');

  try {
    const {
      title, type, city, address, price, price_unit, description,
      facilities, owner_name, owner_whatsapp, bedrooms, bathrooms,
      area, user_id, category_id, city_id
    } = req.body;

    // Validasi
    if (!title || !type || !address || !price || !owner_name || !owner_whatsapp || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Field wajib tidak lengkap'
      });
    }

    // ✅ CEK TOKEN USER SEBELUM UPLOAD
    const checkTokenSql = 'SELECT tokens, role FROM users WHERE id = ?';
    
    db.query(checkTokenSql, [user_id], (err, userResults) => {
      if (err) {
        console.error('❌ Error checking tokens:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengecek token'
        });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
      
      const userTokens = userResults[0].tokens;
      const userRole = userResults[0].role;
      
      // ✅ VALIDASI TOKEN (HANYA UNTUK MITRA)
      if (userRole === 'mitra' && userTokens < 15) {
        return res.status(403).json({
          success: false,
          message: `Token tidak mencukupi! Anda memiliki ${userTokens} token, dibutuhkan 15 token untuk upload properti.`
        });
      }
      
      // ✅ VALIDASI FOTO WAJIB ADA
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimal 1 foto harus diupload'
        });
      }

      // ✅ PROSES UPLOAD FOTO
      let imagePaths = [];
      if (req.files && req.files.length > 0) {
        imagePaths = req.files.map(file => `/uploads/${file.filename}`);
      }

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

      let finalCategoryId = category_id;
      if (!finalCategoryId) {
        const typeMap = { 'kost': 1, 'guesthouse': 2, 'villa': 3 };
        finalCategoryId = typeMap[type.toLowerCase()] || 1;
      }

      const insertProperty = (finalCityId) => {
        const facilitiesJson = JSON.stringify(facilitiesArray);

        // ✅ STEP 1: INSERT PROPERTI (TANPA KOLOM IMAGE)
        const sql = `
          INSERT INTO properties (
            user_id, title, type, category_id, city_id, address, price, price_unit,
            description, facilities, owner_name, owner_whatsapp, 
            bedrooms, bathrooms, area, status, views, whatsapp_clicks, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 0, 0, NOW())
        `;

        const values = [
          user_id, title, type.toLowerCase(), finalCategoryId, finalCityId,
          address, parseFloat(price), price_unit || 'bulan', description || '',
          facilitiesJson, owner_name, owner_whatsapp,
          parseInt(bedrooms) || 1, parseInt(bathrooms) || 1, parseFloat(area) || 0
        ];

        db.query(sql, values, (err, result) => {
          if (err) {
            console.error('❌ Insert property error:', err);
            return res.status(500).json({
              success: false,
              message: 'Gagal menyimpan properti',
              error: err.message
            });
          }

          const propertyId = result.insertId;

          // ✅ STEP 2: INSERT SEMUA FOTO KE TABEL IMAGES
          const imageInserts = imagePaths.map((path, index) => {
            return new Promise((resolve, reject) => {
              const insertImageSql = `
                INSERT INTO images (property_id, image_path, is_primary, display_order, created_at)
                VALUES (?, ?, ?, ?, NOW())
              `;
              const isPrimary = index === 0 ? 1 : 0; // Foto pertama jadi primary
              const displayOrder = index + 1;

              db.query(insertImageSql, [propertyId, path, isPrimary, displayOrder], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          });

          // ✅ JALANKAN SEMUA INSERT FOTO
          Promise.all(imageInserts)
            .then(() => {
              // ✅ KURANGI TOKEN SETELAH BERHASIL UPLOAD (HANYA UNTUK MITRA)
              if (userRole === 'mitra') {
                const updateTokenSql = 'UPDATE users SET tokens = tokens - 15 WHERE id = ?';
                db.query(updateTokenSql, [user_id], (err) => {
                  if (err) {
                    console.error('❌ Error updating tokens:', err);
                  } else {
                    console.log(`✅ Token reduced: User ${user_id} now has ${userTokens - 15} tokens`);
                  }
                });
              }

              console.log(`✅ Property uploaded! ID: ${propertyId}, Images: ${imagePaths.length}`);
              res.json({
                success: true,
                message: 'Properti berhasil diupload! Token Anda dikurangi 15.',
                propertyId: propertyId,
                remainingTokens: userRole === 'mitra' ? userTokens - 15 : null
              });
            })
            .catch(err => {
              console.error('❌ Error inserting images:', err);
              res.status(500).json({
                success: false,
                message: 'Properti tersimpan tapi gagal menyimpan foto',
                error: err.message
              });
            });
        });
      };

      // Logic untuk city_id (sama seperti sebelumnya)
      let finalCityId = city_id;
      if (!finalCityId && city) {
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
            finalCityId = cityResults[0].id;
            console.log('✅ City found:', city, 'with ID:', finalCityId);
            insertProperty(finalCityId);
          } else {
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
        insertProperty(finalCityId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Kota harus diisi'
        });
      }
    });

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
      LOWER(p.type) as type,
      p.address as alamat,
      COALESCE(ct.name, 'Jakarta') as city,
      TRIM(SUBSTRING_INDEX(p.address, ',', 1)) as district,
      p.price as harga,
      COALESCE(p.price_unit, 'bulan') as priceUnit,
      COALESCE(p.description, '') as description,
      COALESCE(p.facilities, '[]') as facilities,
      COALESCE(p.owner_name, 'Pemilik Properti') as ownerName,
      COALESCE(p.owner_whatsapp, '628123456789') as whatsappNumber,
      COALESCE(p.bedrooms, 1) as bedrooms,
      COALESCE(p.bathrooms, 1) as bathrooms,
      COALESCE(p.area, 20) as area,
      COALESCE(p.is_featured, 0) as isSponsored,
      COALESCE(p.views, 0) as views,
      COALESCE(p.whatsapp_clicks, 0) as whatsappClicks,
      p.status,
      p.created_at as createdAt,
      CASE 
        WHEN p.boosted_until > NOW() THEN 1 
        ELSE 0 
      END as is_boosted,
      CASE
        WHEN p.boosted_until > NOW() 
        THEN DATEDIFF(p.boosted_until, NOW())
        ELSE 0
      END as boost_days_remaining,
      p.boosted_until
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

    if (results.length === 0) {
      return res.json([]);
    }

    // ✅ AMBIL SEMUA FOTO UNTUK SETIAP PROPERTI
    const propertyIds = results.map(r => r.id);
    
    const imagesSql = `
      SELECT property_id, image_path, is_primary, display_order 
      FROM images 
      WHERE property_id IN (${propertyIds.join(',')})
      ORDER BY is_primary DESC, display_order ASC
    `;
    
    db.query(imagesSql, (err, imagesResults) => {
      if (err) {
        console.error('Error fetching images:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // ✅ GROUP IMAGES BY PROPERTY_ID
      const imagesMap = {};
      imagesResults.forEach(img => {
        if (!imagesMap[img.property_id]) {
          imagesMap[img.property_id] = [];
        }
        imagesMap[img.property_id].push(img.image_path);
      });
      
      const formatted = results.map(row => {
        let facilities = [];
        try {
          facilities = JSON.parse(row.facilities);
        } catch (e) {
          facilities = [];
        }

        const images = imagesMap[row.id] || [];

        return {
          ...row,
          harga: parseFloat(row.harga) || 0,
          facilities,
          images  // ✅ DARI TABEL IMAGES
        };
      });

      console.log(`✅ Fetched ${formatted.length} properties for mitra ${userId}`);
      res.json(formatted);
    });
  });
});

// ========== API DELETE PROPERTY ==========
app.delete('/api/properties/:id', (req, res) => {
  const { id } = req.params;

  // ✅ AMBIL SEMUA FOTO DARI TABEL IMAGES
  const selectImagesSql = 'SELECT image_path FROM images WHERE property_id = ?';
  
  db.query(selectImagesSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // ✅ HAPUS FILE FOTO DARI DISK
    if (results.length > 0) {
      results.forEach(row => {
        const imagePath = row.image_path;
        if (imagePath.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, imagePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Deleted file:', filePath);
          }
        }
      });
    }

    // ✅ HAPUS DARI DATABASE (images akan terhapus otomatis karena CASCADE)
    const deleteSql = 'DELETE FROM properties WHERE id = ?';
    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      console.log(`✅ Property ${id} and its images deleted`);
      res.json({ success: true, message: 'Properti berhasil dihapus' });
    });
  });
});



// ========== API UPDATE PROPERTY ==========
app.put('/api/properties/:id', upload.array('images', 5), (req, res) => {
  const { id } = req.params;
  
  console.log('📄 Update property request for ID:', id);
  console.log('Body:', req.body);
  console.log('Files:', req.files?.length || 0, 'new images');

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
      category_id
    } = req.body;

    // Validasi
    if (!title || !type || !address || !price || !owner_name || !owner_whatsapp) {
      return res.status(400).json({
        success: false,
        message: 'Field wajib tidak lengkap'
      });
    }

    // ✅ PROSES UPLOAD FOTO BARU (kalau ada)
    let newImagePaths = [];
    if (req.files && req.files.length > 0) {
      newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
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

    const facilitiesJson = JSON.stringify(facilitiesArray);

    // ✅ UPDATE PROPERTY (TANPA KOLOM IMAGE)
    const sql = `
      UPDATE properties 
      SET title = ?, type = ?, category_id = ?, address = ?, price = ?, price_unit = ?,
          description = ?, facilities = ?, owner_name = ?, owner_whatsapp = ?,
          bedrooms = ?, bathrooms = ?, area = ?
      WHERE id = ?
    `;
    
    const values = [
      title,
      type.toLowerCase(),
      finalCategoryId,
      address,
      parseFloat(price),
      price_unit || 'bulan',
      description || '',
      facilitiesJson,
      owner_name,
      owner_whatsapp,
      parseInt(bedrooms) || 1,
      parseInt(bathrooms) || 1,
      parseFloat(area) || 0,
      id
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('❌ Update error:', err);
        return res.status(500).json({
          success: false,
          message: 'Gagal mengupdate properti',
          error: err.message
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Properti tidak ditemukan'
        });
      }

      // ✅ JIKA ADA FOTO BARU, HAPUS FOTO LAMA & INSERT FOTO BARU
      if (newImagePaths.length > 0) {
        // STEP 1: Ambil foto lama untuk dihapus dari disk
        const getOldImagesSql = 'SELECT image_path FROM images WHERE property_id = ?';
        
        db.query(getOldImagesSql, [id], (err, oldImages) => {
          if (err) {
            console.error('❌ Error getting old images:', err);
          }
          
          // Hapus file lama dari disk
          if (oldImages && oldImages.length > 0) {
            oldImages.forEach(row => {
              const filePath = path.join(__dirname, row.image_path);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️ Deleted old file:', filePath);
              }
            });
          }
          
          // STEP 2: Hapus semua foto lama dari database
          const deleteOldImagesSql = 'DELETE FROM images WHERE property_id = ?';
          
          db.query(deleteOldImagesSql, [id], (err) => {
            if (err) {
              console.error('❌ Error deleting old images from DB:', err);
            }
            
            // STEP 3: Insert foto baru ke database
            const imageInserts = newImagePaths.map((path, index) => {
              return new Promise((resolve, reject) => {
                const insertImageSql = `
                  INSERT INTO images (property_id, image_path, is_primary, display_order, created_at)
                  VALUES (?, ?, ?, ?, NOW())
                `;
                const isPrimary = index === 0 ? 1 : 0;
                const displayOrder = index + 1;

                db.query(insertImageSql, [id, path, isPrimary, displayOrder], (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
            });

            Promise.all(imageInserts)
              .then(() => {
                console.log(`✅ Property ${id} updated with ${newImagePaths.length} new images`);
                res.json({
                  success: true,
                  message: 'Properti dan foto berhasil diupdate',
                  propertyId: id
                });
              })
              .catch(err => {
                console.error('❌ Error inserting new images:', err);
                res.json({
                  success: true,
                  message: 'Properti updated tapi ada error di foto',
                  propertyId: id
                });
              });
          });
        });
      } else {
        // Tidak ada foto baru, hanya update data properti
        console.log('✅ Property updated without new images! ID:', id);
        res.json({
          success: true,
          message: 'Properti berhasil diupdate',
          propertyId: id
        });
      }
    });
  } catch (error) {
    console.error('❌ Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
});

// ========== API REGISTER ==========
app.post('/api/register', async (req, res) => {
  const { name, email, phone, password } = req.body; // ✅ Hapus whatsapp dari sini
  
  console.log('🔐 Register attempt:', email);
  
  // Validasi input
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Semua field wajib diisi' 
    });
  }
  
  try {
    // ✅ CEK EMAIL DAN PHONE SEKALIGUS
    const checkDuplicateSql = 'SELECT id, email, phone FROM users WHERE email = ? OR phone = ?';
    
    db.query(checkDuplicateSql, [email, phone], async (err, results) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Terjadi kesalahan server' 
        });
      }
      
      // Validasi email dan phone duplikat
      const emailExists = results.find(user => user.email === email);
      if (emailExists) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email sudah terdaftar' 
        });
      }
      
      const phoneExists = results.find(user => user.phone === phone);
      if (phoneExists) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nomor telepon sudah terdaftar' 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Cegah register dengan email admin
      if (email.toLowerCase().includes('admin')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Email tidak valid untuk registrasi' 
        });
      }

      // ✅ KONVERSI NOMOR TELEPON KE FORMAT WHATSAPP (62xxx)
      let whatsappNumber = phone.replace(/\D/g, ''); // Hapus semua karakter non-digit
      
      if (whatsappNumber.startsWith('0')) {
        // Jika diawali 0, ganti dengan 62
        whatsappNumber = '62' + whatsappNumber.substring(1);
      } else if (!whatsappNumber.startsWith('62')) {
        // Jika belum ada kode negara, tambahkan 62
        whatsappNumber = '62' + whatsappNumber;
      }

      // ✅ INSERT USER BARU dengan whatsapp otomatis terkonversi
      const insertSql = `
        INSERT INTO users (name, email, phone, whatsapp, password, role, tokens, created_at) 
        VALUES (?, ?, ?, ?, ?, 'mitra', 30, NOW())
      `;
      
      const values = [
        name,
        email,
        phone,
        whatsappNumber, // ✅ Gunakan hasil konversi
        hashedPassword
      ];
      
      db.query(insertSql, values, (err, result) => {
        if (err) {
          console.error('❌ Insert error:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Gagal menyimpan data' 
          });
        }
        
        console.log('✅ User registered successfully:', email, '(role: mitra, tokens: 30)');
        console.log(`📞 Phone: ${phone} → WhatsApp: ${whatsappNumber}`); // ✅ Log konversi
        
        res.status(201).json({
          success: true,
          message: 'Registrasi berhasil! Anda mendapat 30 token gratis.',
          userId: result.insertId
        });
      });
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan server' 
    });
  }
});


// ============================================
// BACKEND API ENDPOINTS untuk Admin Dashboard
// Tambahkan ke file index.js (SEBELUM app.listen())
// ============================================

// ========== API GET ALL USERS (Admin Only) ==========
app.get('/api/admin/users', (req, res) => {
  const sql = `
    SELECT 
      id, 
      name, 
      email, 
      phone, 
      whatsapp, 
      role, 
      is_active,
      tokens,      -- ✅ TAMBAH INI
      created_at 
    FROM users 
    ORDER BY created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    console.log(`✅ Fetched ${results.length} users`);
    res.json(results);
  });
});


// ========== API GET STATS (Admin Only) ==========
app.get('/api/admin/stats', (req, res) => {
  const queries = {
    totalProperties: 'SELECT COUNT(*) as count FROM properties',
    totalMitra: "SELECT COUNT(*) as count FROM users WHERE role = 'mitra'",
    totalUsers: 'SELECT COUNT(*) as count FROM users',
    activeMitra: "SELECT COUNT(*) as count FROM users WHERE role = 'mitra' AND is_active = 1"
  };

  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, results) => {
      if (!err && results && results[0]) {
        stats[key] = results[0].count;
      } else {
        stats[key] = 0;
      }
      
      completed++;
      if (completed === total) {
        console.log('✅ Stats fetched:', stats);
        res.json(stats);
      }
    });
  });
});

// ========== API TOGGLE USER STATUS (Admin Only) ==========
app.put('/api/admin/users/:id/toggle-status', (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  // Validasi: tidak bisa nonaktifkan admin
  const checkSql = 'SELECT role FROM users WHERE id = ?';
  db.query(checkSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (results[0].role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot modify admin status' 
      });
    }
    
    // Update status
    const updateSql = 'UPDATE users SET is_active = ? WHERE id = ?';
    db.query(updateSql, [is_active, id], (err, result) => {
      if (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update status' 
        });
      }
      
      console.log(`✅ User ${id} status changed to ${is_active}`);
      res.json({ 
        success: true, 
        message: 'Status updated successfully' 
      });
    });
  });
});

// ========== API DELETE USER (Admin Only) ==========
app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  
  // Validasi: tidak bisa hapus admin
  const checkSql = 'SELECT role FROM users WHERE id = ?';
  db.query(checkSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (results[0].role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete admin user' 
      });
    }
    
    // Delete user (properties akan terhapus otomatis karena ON DELETE CASCADE)
    const deleteSql = 'DELETE FROM users WHERE id = ?';
    db.query(deleteSql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to delete user' 
        });
      }
      
      console.log(`✅ User ${id} deleted`);
      res.json({ 
        success: true, 
        message: 'User deleted successfully' 
      });
    });
  });
});


// ============================================
// TAMBAHKAN KE FILE index.js ANDA
// Letakkan SEBELUM app.listen()
// ============================================

// ========== API UBAH PASSWORD ADMIN ==========
app.put('/api/admin/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  
  console.log('🔐 Change password request for user ID:', userId);
  
  // Validasi input
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Data tidak lengkap'
    });
  }
  
  // Validasi panjang password baru
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password baru minimal 6 karakter'
    });
  }
  
  try {
    // Ambil data user dari database
    const selectSql = 'SELECT id, password, role FROM users WHERE id = ?';
    
    db.query(selectSql, [userId], async (err, results) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database'
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
      
      const user = results[0];
      
      // Pastikan user adalah admin
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak'
        });
      }
      
      // Verifikasi password lama
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password saat ini salah'
        });
      }
      
      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password di database
      const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
      
      db.query(updateSql, [hashedPassword, userId], (err, result) => {
        if (err) {
          console.error('❌ Update error:', err);
          return res.status(500).json({
            success: false,
            message: 'Gagal mengubah password'
          });
        }
        
        console.log(`✅ Password changed successfully for user ${userId}`);
        
        res.json({
          success: true,
          message: 'Password berhasil diubah'
        });
      });
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});


// ============================================
// TAMBAHKAN KE FILE index.js ANDA
// Letakkan SEBELUM app.listen()
// ============================================

// ========== API GET FOOTER SETTINGS (PUBLIC) ==========
app.get('/api/settings/footer', (req, res) => {
  const sql = 'SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE "footer_%"';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching footer settings:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    // Convert array ke object untuk kemudahan akses
    const settings = {};
    results.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    console.log('✅ Footer settings loaded');
    res.json(settings);
  });
});

// ========== API UPDATE FOOTER SETTINGS (ADMIN ONLY) ==========
app.put('/api/admin/settings/footer', (req, res) => {
  const { userId, settings } = req.body;
  
  console.log('📝 Update footer settings by user:', userId);
  
  if (!userId || !settings) {
    return res.status(400).json({
      success: false,
      message: 'Data tidak lengkap'
    });
  }
  
  // Verifikasi admin
  const checkAdminSql = 'SELECT role FROM users WHERE id = ?';
  db.query(checkAdminSql, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }
    
    if (results[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat mengubah pengaturan'
      });
    }
    
    // Update setiap setting
    const updatePromises = [];
    
    Object.keys(settings).forEach(key => {
      const updateSql = `
        UPDATE site_settings 
        SET setting_value = ?, updated_by = ? 
        WHERE setting_key = ?
      `;
      
      updatePromises.push(
        new Promise((resolve, reject) => {
          db.query(updateSql, [settings[key], userId, key], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
      );
    });
    
    Promise.all(updatePromises)
      .then(() => {
        console.log('✅ Footer settings updated successfully');
        res.json({
          success: true,
          message: 'Pengaturan footer berhasil diperbarui'
        });
      })
      .catch(error => {
        console.error('❌ Error updating settings:', error);
        res.status(500).json({
          success: false,
          message: 'Gagal memperbarui pengaturan'
        });
      });
  });
});

// ========== API GET ADMIN PROFILE ==========
app.get('/api/admin/profile/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'SELECT id, name, email, phone, whatsapp, role FROM users WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ Admin profile loaded');
    res.json(results[0]);
  });
});

// ========== API UPDATE ADMIN PROFILE ==========
app.put('/api/admin/profile/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, whatsapp } = req.body;
  
  console.log('📝 Update admin profile:', id);
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Nama dan email wajib diisi'
    });
  }
  
  // Cek apakah user adalah admin
  const checkSql = 'SELECT role FROM users WHERE id = ?';
  db.query(checkSql, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak'
      });
    }
    
    if (results[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Hanya admin yang dapat mengubah profil'
      });
    }
    
    // Update profil
    const updateSql = `
      UPDATE users 
      SET name = ?, email = ?, phone = ?, whatsapp = ? 
      WHERE id = ?
    `;
    
    db.query(updateSql, [name, email, phone, whatsapp, id], (err, result) => {
      if (err) {
        console.error('❌ Error updating profile:', err);
        return res.status(500).json({
          success: false,
          message: 'Gagal memperbarui profil'
        });
      }
      
      console.log('✅ Admin profile updated');
      res.json({
        success: true,
        message: 'Profil berhasil diperbarui',
        user: { name, email, phone, whatsapp }
      });
    });
  });
});


// ========== API ADMIN: TAMBAH TOKEN KE USER ==========
app.post('/api/admin/add-tokens', (req, res) => {
  const { userId, tokens } = req.body;
  
  console.log('🪙 Admin adding tokens:', { userId, tokens });
  
  // Validasi input
  if (!userId || !tokens) {
    return res.status(400).json({
      success: false,
      message: 'User ID dan jumlah token wajib diisi'
    });
  }
  
  // Validasi token harus kelipatan 15
  const validPackages = [15, 30, 75, 150, 330, 690];
  if (!validPackages.includes(tokens)) {
    return res.status(400).json({
      success: false,
      message: 'Paket token tidak valid'
    });
  }
  
  // Cek apakah user ada dan role-nya mitra
  const checkUserSql = 'SELECT id, name, role, tokens FROM users WHERE id = ?';
  
  db.query(checkUserSql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error checking user:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    const user = results[0];
    
    // Pastikan user adalah mitra
    if (user.role !== 'mitra') {
      return res.status(403).json({
        success: false,
        message: 'Hanya bisa menambah token ke akun mitra'
      });
    }
    
    // Update token
    const updateSql = 'UPDATE users SET tokens = tokens + ? WHERE id = ?';
    
    db.query(updateSql, [tokens, userId], (err, result) => {
      if (err) {
        console.error('❌ Error updating tokens:', err);
        return res.status(500).json({
          success: false,
          message: 'Gagal menambahkan token'
        });
      }
      
      const newTotal = user.tokens + tokens;
      
      console.log(`✅ Tokens added: User ${user.name} now has ${newTotal} tokens (+${tokens})`);
      
      res.json({
        success: true,
        message: 'Token berhasil ditambahkan',
        data: {
          userId: user.id,
          userName: user.name,
          tokensAdded: tokens,
          newTotal: newTotal
        }
      });
    });
  });
});


// ========== API GET USER TOKENS ==========
app.get('/api/users/:id/tokens', (req, res) => {
  const { id } = req.params;
  
  console.log('🪙 Fetching tokens for user:', id);
  
  const sql = 'SELECT tokens FROM users WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching tokens:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const tokens = results[0].tokens || 0;
    
    console.log(`✅ User ${id} has ${tokens} tokens`);
    
    res.json({
      success: true,
      tokens: tokens
    });
  });
});


// ========== API UBAH PASSWORD MITRA ==========
app.put('/api/mitra/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  
  console.log('🔐 Change password request for mitra ID:', userId);
  
  // Validasi input
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Data tidak lengkap'
    });
  }
  
  // Validasi panjang password baru
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password baru minimal 6 karakter'
    });
  }
  
  try {
    // Ambil data user dari database
    const selectSql = 'SELECT id, password, role FROM users WHERE id = ?';
    
    db.query(selectSql, [userId], async (err, results) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database'
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
      
      const user = results[0];
      
      // Pastikan user adalah mitra
      if (user.role !== 'mitra') {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak'
        });
      }
      
      // Verifikasi password lama
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Password saat ini salah'
        });
      }
      
      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password di database
      const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
      
      db.query(updateSql, [hashedPassword, userId], (err, result) => {
        if (err) {
          console.error('❌ Update error:', err);
          return res.status(500).json({
            success: false,
            message: 'Gagal mengubah password'
          });
        }
        
        console.log(`✅ Password changed successfully for mitra ${userId}`);
        
        res.json({
          success: true,
          message: 'Password berhasil diubah'
        });
      });
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// ========== API GET USER BY ID (untuk profil mitra) ==========
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'SELECT id, name, email, phone, whatsapp, role, tokens FROM users WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User data loaded:', results[0].email);
    res.json(results[0]);
  });
});




// ========== API GET SEMUA DATA HALAMAN PASANG IKLAN ==========
app.get('/api/pasang-iklan/content', (req, res) => {
  console.log('📄 Fetching Pasang Iklan page content');
  
  const queries = {
    hero: 'SELECT * FROM pasang_iklan_hero WHERE is_active = 1 LIMIT 1',
    steps: 'SELECT * FROM pasang_iklan_steps WHERE is_active = 1 ORDER BY display_order ASC',
    plans: 'SELECT * FROM pasang_iklan_plans WHERE is_active = 1 ORDER BY display_order ASC',
    tokenPackages: 'SELECT * FROM pasang_iklan_token_packages WHERE is_active = 1 ORDER BY display_order ASC',
    cta: 'SELECT * FROM pasang_iklan_cta WHERE is_active = 1 LIMIT 1'
  };
  
  const results = {};
  let completed = 0;
  
  // Fetch Hero
  db.query(queries.hero, (err, heroResults) => {
    if (err) {
      console.error('Error fetching hero:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    results.hero = heroResults[0] || null;
    completed++;
    
    if (completed === 5) sendResponse();
  });
  
  // Fetch Steps
  db.query(queries.steps, (err, stepsResults) => {
    if (err) {
      console.error('Error fetching steps:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    results.steps = stepsResults;
    completed++;
    
    if (completed === 5) sendResponse();
  });
  
  // Fetch Plans + Features
  db.query(queries.plans, (err, plansResults) => {
    if (err) {
      console.error('Error fetching plans:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (plansResults.length === 0) {
      results.plans = [];
      completed++;
      if (completed === 5) sendResponse();
      return;
    }
    
    const planIds = plansResults.map(p => p.id);
    const featuresSql = `SELECT * FROM pasang_iklan_plan_features WHERE plan_id IN (${planIds.join(',')}) ORDER BY display_order ASC`;
    
    db.query(featuresSql, (err, featuresResults) => {
      if (err) {
        console.error('Error fetching features:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Group features by plan_id
      const featuresMap = {};
      featuresResults.forEach(feature => {
        if (!featuresMap[feature.plan_id]) {
          featuresMap[feature.plan_id] = [];
        }
        featuresMap[feature.plan_id].push(feature.feature_text);
      });
      
      // Attach features to plans
      results.plans = plansResults.map(plan => ({
        ...plan,
        features: featuresMap[plan.id] || []
      }));
      
      completed++;
      if (completed === 5) sendResponse();
    });
  });
  
  // Fetch Token Packages
  db.query(queries.tokenPackages, (err, packagesResults) => {
    if (err) {
      console.error('Error fetching token packages:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    results.tokenPackages = packagesResults;
    completed++;
    
    if (completed === 5) sendResponse();
  });
  
  // Fetch CTA
  db.query(queries.cta, (err, ctaResults) => {
    if (err) {
      console.error('Error fetching cta:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    results.cta = ctaResults[0] || null;
    completed++;
    
    if (completed === 5) sendResponse();
  });
  
  function sendResponse() {
    console.log('✅ Pasang Iklan content loaded');
    res.json({
      success: true,
      data: results
    });
  }
});

// ========== API UPDATE HERO SECTION ==========
app.put('/api/admin/pasang-iklan/hero', (req, res) => {
  const { title, subtitle } = req.body;
  
  console.log('📝 Updating Pasang Iklan hero');
  
  const sql = 'UPDATE pasang_iklan_hero SET title = ?, subtitle = ? WHERE id = 1';
  
  db.query(sql, [title, subtitle], (err, result) => {
    if (err) {
      console.error('Error updating hero:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Hero updated');
    res.json({ success: true, message: 'Hero berhasil diupdate' });
  });
});

// ========== API UPDATE STEPS ==========
app.put('/api/admin/pasang-iklan/steps/:id', (req, res) => {
  const { id } = req.params;
  const { step_number, title, description } = req.body;
  
  console.log('📝 Updating step:', id);
  
  const sql = 'UPDATE pasang_iklan_steps SET step_number = ?, title = ?, description = ? WHERE id = ?';
  
  db.query(sql, [step_number, title, description, id], (err, result) => {
    if (err) {
      console.error('Error updating step:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Step updated');
    res.json({ success: true, message: 'Step berhasil diupdate' });
  });
});

// ========== API ADD NEW STEP ==========
app.post('/api/admin/pasang-iklan/steps', (req, res) => {
  const { step_number, title, description, display_order } = req.body;
  
  console.log('➕ Adding new step');
  
  const sql = 'INSERT INTO pasang_iklan_steps (step_number, title, description, display_order) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [step_number, title, description, display_order || 999], (err, result) => {
    if (err) {
      console.error('Error adding step:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Step added');
    res.json({ success: true, message: 'Step berhasil ditambahkan', id: result.insertId });
  });
});

// ========== API DELETE STEP ==========
app.delete('/api/admin/pasang-iklan/steps/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️ Deleting step:', id);
  
  const sql = 'DELETE FROM pasang_iklan_steps WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting step:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Step deleted');
    res.json({ success: true, message: 'Step berhasil dihapus' });
  });
});

// ========== API UPDATE PLAN ==========
app.put('/api/admin/pasang-iklan/plans/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, period, description, icon, is_popular } = req.body;
  
  console.log('📝 Updating plan:', id);
  
  const sql = `UPDATE pasang_iklan_plans 
               SET name = ?, price = ?, period = ?, description = ?, icon = ?, is_popular = ? 
               WHERE id = ?`;
  
  db.query(sql, [name, price, period, description, icon, is_popular ? 1 : 0, id], (err, result) => {
    if (err) {
      console.error('Error updating plan:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Plan updated');
    res.json({ success: true, message: 'Plan berhasil diupdate' });
  });
});

// ========== API UPDATE PLAN FEATURES ==========
app.put('/api/admin/pasang-iklan/plans/:id/features', (req, res) => {
  const { id } = req.params;
  const { features } = req.body; // Array of strings
  
  console.log('📝 Updating plan features for plan:', id);
  
  // Delete existing features
  const deleteSql = 'DELETE FROM pasang_iklan_plan_features WHERE plan_id = ?';
  
  db.query(deleteSql, [id], (err) => {
    if (err) {
      console.error('Error deleting old features:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!features || features.length === 0) {
      return res.json({ success: true, message: 'Features berhasil diupdate' });
    }
    
    // Insert new features
    const insertValues = features.map((feature, index) => [id, feature, index + 1]);
    const insertSql = 'INSERT INTO pasang_iklan_plan_features (plan_id, feature_text, display_order) VALUES ?';
    
    db.query(insertSql, [insertValues], (err) => {
      if (err) {
        console.error('Error inserting features:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      console.log('✅ Plan features updated');
      res.json({ success: true, message: 'Features berhasil diupdate' });
    });
  });
});

// ========== API UPDATE TOKEN PACKAGE ==========
app.put('/api/admin/pasang-iklan/token-packages/:id', (req, res) => {
  const { id } = req.params;
  const { tokens, price, bonus } = req.body;
  
  console.log('📝 Updating token package:', id);
  
  const sql = 'UPDATE pasang_iklan_token_packages SET tokens = ?, price = ?, bonus = ? WHERE id = ?';
  
  db.query(sql, [tokens, price, bonus || 0, id], (err, result) => {
    if (err) {
      console.error('Error updating token package:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Token package updated');
    res.json({ success: true, message: 'Token package berhasil diupdate' });
  });
});

// ========== API ADD NEW TOKEN PACKAGE ==========
app.post('/api/admin/pasang-iklan/token-packages', (req, res) => {
  const { tokens, price, bonus, display_order } = req.body;
  
  console.log('➕ Adding new token package');
  
  const sql = 'INSERT INTO pasang_iklan_token_packages (tokens, price, bonus, display_order) VALUES (?, ?, ?, ?)';
  
  db.query(sql, [tokens, price, bonus || 0, display_order || 999], (err, result) => {
    if (err) {
      console.error('Error adding token package:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Token package added');
    res.json({ success: true, message: 'Token package berhasil ditambahkan', id: result.insertId });
  });
});

// ========== API DELETE TOKEN PACKAGE ==========
app.delete('/api/admin/pasang-iklan/token-packages/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️ Deleting token package:', id);
  
  const sql = 'DELETE FROM pasang_iklan_token_packages WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting token package:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ Token package deleted');
    res.json({ success: true, message: 'Token package berhasil dihapus' });
  });
});

// ========== API UPDATE CTA SECTION ==========
app.put('/api/admin/pasang-iklan/cta', (req, res) => {
  const { title, description, button_text, whatsapp_number, whatsapp_message } = req.body;
  
  console.log('📝 Updating CTA section');
  
  const sql = `UPDATE pasang_iklan_cta 
               SET title = ?, description = ?, button_text = ?, whatsapp_number = ?, whatsapp_message = ? 
               WHERE id = 1`;
  
  db.query(sql, [title, description, button_text, whatsapp_number, whatsapp_message], (err, result) => {
    if (err) {
      console.error('Error updating CTA:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log('✅ CTA updated');
    res.json({ success: true, message: 'CTA berhasil diupdate' });
  });
});



// ========== API BOOST PROPERTY ==========
app.post('/api/properties/:id/boost', (req, res) => {
  const propertyId = req.params.id;
  const { user_id } = req.body;
  
  console.log('🚀 Boost property request:', propertyId, 'by user:', user_id);
  
  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: 'User ID tidak ditemukan'
    });
  }
  
  // ✅ STEP 1: Cek kepemilikan properti
  const checkOwnerSql = 'SELECT user_id FROM properties WHERE id = ?';
  
  db.query(checkOwnerSql, [propertyId], (err, propertyResults) => {
    if (err) {
      console.error('❌ Error checking property:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengecek properti'
      });
    }
    
    if (propertyResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Properti tidak ditemukan'
      });
    }
    
    if (propertyResults[0].user_id !== parseInt(user_id)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk boost properti ini'
      });
    }
    
    // ✅ STEP 2: Cek token user
    const checkTokenSql = 'SELECT tokens FROM users WHERE id = ?';
    
    db.query(checkTokenSql, [user_id], (err, userResults) => {
      if (err) {
        console.error('❌ Error checking tokens:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan saat mengecek token'
        });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }
      
      const userTokens = userResults[0].tokens;
      
      if (userTokens < 15) {
        return res.status(403).json({
          success: false,
          message: `Token tidak mencukupi! Anda memiliki ${userTokens} token, dibutuhkan 15 token untuk boost properti.`
        });
      }
      
      // ✅ STEP 3: Hitung tanggal berakhir (7 hari dari sekarang)
      const now = new Date();
      const boostUntil = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 hari
      
      // ✅ STEP 4: Update properti dengan boost
      const updatePropertySql = `
        UPDATE properties 
        SET boosted_until = ?, boost_activated_at = NOW() 
        WHERE id = ?
      `;
      
      db.query(updatePropertySql, [boostUntil, propertyId], (err) => {
        if (err) {
          console.error('❌ Error updating property:', err);
          return res.status(500).json({
            success: false,
            message: 'Gagal mengaktifkan boost'
          });
        }
        
        // ✅ STEP 5: Kurangi token user
        const updateTokenSql = 'UPDATE users SET tokens = tokens - 15 WHERE id = ?';
        
        db.query(updateTokenSql, [user_id], (err) => {
          if (err) {
            console.error('❌ Error updating tokens:', err);
            return res.status(500).json({
              success: false,
              message: 'Boost berhasil tapi gagal mengurangi token'
            });
          }
          
          console.log(`✅ Property ${propertyId} boosted until ${boostUntil}`);
          console.log(`✅ User ${user_id} tokens reduced by 15`);
          
          res.json({
            success: true,
            message: 'Properti berhasil di-boost selama 7 hari!',
            boosted_until: boostUntil,
            remaining_tokens: userTokens - 15
          });
        });
      });
    });
  });
});





// ========== GET USER PROPERTIES (DASHBOARD) - DENGAN BOOST INFO ==========
// ⚠️ GANTI endpoint '/api/user-properties/:userId' yang sudah ada dengan yang ini
app.get('/api/user-properties/:userId', (req, res) => {
  const userId = req.params.userId;
  
  console.log(`📥 Fetching properties for user ${userId} with boost info`);

  const sql = `
    SELECT 
      p.*,
      c.name as city,
      cat.name as category_name,
      CASE 
        WHEN p.boosted_until > NOW() THEN 1 
        ELSE 0 
      END as is_boosted,
      CASE
        WHEN p.boosted_until > NOW() 
        THEN DATEDIFF(p.boosted_until, NOW())
        ELSE 0
      END as boost_days_remaining
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [userId], (err, propertiesResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }

    console.log(`✅ Found ${propertiesResults.length} properties for user ${userId}`);
    
    if (propertiesResults.length === 0) {
      return res.json([]);
    }

    // Get images for all properties
    const propertyIds = propertiesResults.map(p => p.id);
    const imagesSql = `
      SELECT property_id, image_path, is_primary, display_order
      FROM images 
      WHERE property_id IN (?)
      ORDER BY property_id, display_order
    `;

    db.query(imagesSql, [propertyIds], (err, imagesResults) => {
      if (err) {
        console.error('Error fetching images:', err);
        return res.status(500).json({ 
          error: 'Database error', 
          details: err.message 
        });
      }

      // Group images by property_id
      const imagesMap = new Map();
      imagesResults.forEach(img => {
        if (!imagesMap.has(img.property_id)) {
          imagesMap.set(img.property_id, []);
        }
        imagesMap.get(img.property_id).push(img.image_path);
      });

      // Combine properties with images
      const properties = propertiesResults.map(property => ({
        id: property.id,
        nama: property.title,
        type: property.type,
        city: property.city,
        alamat: property.address,
        harga: property.price,
        priceUnit: property.price_unit,
        description: property.description,
        facilities: property.facilities,
        ownerName: property.owner_name,
        whatsappNumber: property.owner_whatsapp,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        status: property.status,
        views: property.views,
        whatsappClicks: property.whatsapp_clicks,
        createdAt: property.created_at,
        category_name: property.category_name,
        is_boosted: property.is_boosted,
        boost_days_remaining: property.boost_days_remaining,
        boosted_until: property.boosted_until,
        images: imagesMap.get(property.id) || []
      }));

      console.log(`✅ Returning ${properties.length} properties with images and boost info`);
      res.json(properties);
    });
  });
});


// ========================================
// OPTIONAL: API untuk cek status boost
// ========================================
// ========== GET ALL PROPERTIES (FIXED - DENGAN BOOST INFO & SORTING) ==========
// ⚠️ GANTI endpoint '/api/properties' yang sudah ada dengan kode ini

app.get('/api/properties', (req, res) => {
  console.log('📥 Fetching all properties with boost info and sorting');

  const sql = `
    SELECT 
      p.*,
      c.name as city,
      cat.name as category_name,
      u.name as uploader_name,
      u.role as uploader_role,
      CASE 
        WHEN p.boosted_until > NOW() THEN 1 
        ELSE 0 
      END as is_boosted,
      CASE
        WHEN p.boosted_until > NOW() 
        THEN DATEDIFF(p.boosted_until, NOW())
        ELSE 0
      END as boost_days_remaining
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.status = 'available'
    ORDER BY 
      is_boosted DESC,           -- ✅ Properti boost di paling atas
      p.created_at DESC          -- Lalu urutkan dari yang terbaru
  `;

  db.query(sql, (err, propertiesResults) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }

    if (propertiesResults.length === 0) {
      console.log('⚠️ No properties found');
      return res.json([]);
    }

    // Get all property IDs
    const propertyIds = propertiesResults.map(p => p.id);

    // Get images for all properties
    const imagesSql = `
      SELECT property_id, image_path, is_primary, display_order
      FROM images 
      WHERE property_id IN (?)
      ORDER BY property_id, display_order
    `;

    db.query(imagesSql, [propertyIds], (err, imagesResults) => {
      if (err) {
        console.error('❌ Error fetching images:', err);
        return res.status(500).json({ 
          error: 'Database error', 
          details: err.message 
        });
      }

      // Group images by property_id
      const imagesMap = new Map();
      imagesResults.forEach(img => {
        if (!imagesMap.has(img.property_id)) {
          imagesMap.set(img.property_id, []);
        }
        imagesMap.get(img.property_id).push(img.image_path);
      });

      // Combine properties with images
      const propertiesWithImages = propertiesResults.map(row => {
        // ✅ Parse facilities jadi array
        let facilitiesArray = [];
        try {
          if (typeof row.facilities === 'string') {
            facilitiesArray = JSON.parse(row.facilities);
          } else if (Array.isArray(row.facilities)) {
            facilitiesArray = row.facilities;
          }
        } catch (e) {
          console.error('Error parsing facilities for property', row.id, e);
          facilitiesArray = [];
        }

        return {
          id: row.id,
          title: row.title,
          type: row.type,
          city: row.city,
          address: row.address,
          price: Math.floor(row.price), // ✅ CONVERT ke integer
          price_unit: row.price_unit,
          description: row.description,
          facilities: facilitiesArray, // ✅ Return as array
          owner_name: row.owner_name,
          owner_whatsapp: row.owner_whatsapp,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          area: row.area,
          status: row.status,
          views: row.views,
          whatsapp_clicks: row.whatsapp_clicks,
          created_at: row.created_at,
          category_name: row.category_name,
          uploader_name: row.uploader_name,
          uploader_role: row.uploader_role,
          is_boosted: row.is_boosted,
          boost_days_remaining: row.boost_days_remaining,
          boosted_until: row.boosted_until,
          images: imagesMap.get(row.id) || []
        };
      });

      // Count boosted and regular properties
      const boostedCount = propertiesWithImages.filter(p => p.is_boosted === 1).length;
      const regularCount = propertiesWithImages.length - boostedCount;

      console.log(`✅ Fetched ${propertiesWithImages.length} properties`);
      console.log(`   🚀 Boosted: ${boostedCount}`);
      console.log(`   📋 Regular: ${regularCount}`);
      
      res.json(propertiesWithImages);
    });
  });
});

app.post('/api/properties/:id/boost', (req, res) => {
  const propertyId = req.params.id;
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ success: false, message: 'User ID tidak ditemukan' });
  }
  
  const checkOwnerSql = 'SELECT user_id FROM properties WHERE id = ?';
  db.query(checkOwnerSql, [propertyId], (err, propertyResults) => {
    if (err || propertyResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Properti tidak ditemukan' });
    }
    
    if (propertyResults[0].user_id !== parseInt(user_id)) {
      return res.status(403).json({ success: false, message: 'Tidak ada akses' });
    }
    
    const checkTokenSql = 'SELECT tokens FROM users WHERE id = ?';
    db.query(checkTokenSql, [user_id], (err, userResults) => {
      if (err || userResults.length === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      }
      
      const userTokens = userResults[0].tokens;
      if (userTokens < 15) {
        return res.status(403).json({
          success: false,
          message: `Token tidak mencukupi! Anda memiliki ${userTokens} token.`
        });
      }
      
      const now = new Date();
      const boostUntil = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const updatePropertySql = 'UPDATE properties SET boosted_until = ?, boost_activated_at = NOW() WHERE id = ?';
      db.query(updatePropertySql, [boostUntil, propertyId], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Gagal boost' });
        }
        
        const updateTokenSql = 'UPDATE users SET tokens = tokens - 15 WHERE id = ?';
        db.query(updateTokenSql, [user_id], (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: 'Boost berhasil tapi token gagal dikurangi' });
          }
          
          console.log(`✅ Property ${propertyId} boosted until ${boostUntil}`);
          res.json({
            success: true,
            message: 'Properti berhasil di-boost selama 7 hari!',
            boosted_until: boostUntil,
            remaining_tokens: userTokens - 15
          });
        });
      });
    });
  });
});

// ========== GET PROPERTY DETAIL BY ID ==========
// ⚠️ TAMBAHKAN KODE INI ke file index.js Anda (sebelum app.listen)

app.get('/api/rumah/:id', (req, res) => {
  const propertyId = req.params.id;
  
  console.log(`📥 Fetching property detail for ID: ${propertyId}`);

  // Query untuk mengambil detail properti dengan join ke tabel cities, categories, dan users
  const sql = `
    SELECT 
      p.*,
      c.name as city,
      cat.name as category_name,
      u.name as uploader_name,
      u.role as uploader_role,
      CASE 
        WHEN p.boosted_until > NOW() THEN 1 
        ELSE 0 
      END as is_boosted
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  db.query(sql, [propertyId], (err, propertyResults) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }

    if (propertyResults.length === 0) {
      console.log(`⚠️ Property ${propertyId} not found`);
      return res.status(404).json({ 
        error: 'Property not found',
        message: 'Properti yang Anda cari tidak ditemukan'
      });
    }

    const property = propertyResults[0];

    // Query untuk mengambil semua gambar properti ini
    const imagesSql = `
      SELECT image_path, is_primary, display_order
      FROM images 
      WHERE property_id = ?
      ORDER BY display_order
    `;

    db.query(imagesSql, [propertyId], (err, imagesResults) => {
      if (err) {
        console.error('❌ Error fetching images:', err);
        return res.status(500).json({ 
          error: 'Database error', 
          details: err.message 
        });
      }

      // ✅ Parse facilities jadi array
      let facilitiesArray = [];
      try {
        if (typeof property.facilities === 'string') {
          facilitiesArray = JSON.parse(property.facilities);
        } else if (Array.isArray(property.facilities)) {
          facilitiesArray = property.facilities;
        }
      } catch (e) {
        console.error('Error parsing facilities:', e);
        facilitiesArray = [];
      }

      // Format response dengan struktur yang sesuai dengan frontend
      const response = {
        id: property.id,
        title: property.title,
        nama: property.title, // alias untuk backward compatibility
        type: property.type,
        city: property.city,
        alamat: property.address,
        address: property.address, // alias
        harga: Math.floor(property.price), // ✅ CONVERT ke integer untuk hilangkan .00
        price: Math.floor(property.price), // alias
        price_unit: property.price_unit,
        priceUnit: property.price_unit, // alias
        description: property.description,
        facilities: facilitiesArray, // ✅ Return as array
        owner_name: property.owner_name,
        ownerName: property.owner_name, // alias
        owner_whatsapp: property.owner_whatsapp,
        whatsappNumber: property.owner_whatsapp, // alias
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        status: property.status,
        views: property.views,
        whatsapp_clicks: property.whatsapp_clicks,
        whatsappClicks: property.whatsapp_clicks, // alias
        created_at: property.created_at,
        createdAt: property.created_at, // alias
        category_name: property.category_name,
        uploader_name: property.uploader_name,
        uploaderName: property.uploader_name, // alias
        uploader_role: property.uploader_role,
        uploaderRole: property.uploader_role, // alias
        is_boosted: property.is_boosted,
        boosted_until: property.boosted_until,
        images: imagesResults.map(img => img.image_path)
      };

      // ✅ OPTIONAL: Update view count (increment views)
      const updateViewsSql = 'UPDATE properties SET views = views + 1 WHERE id = ?';
      db.query(updateViewsSql, [propertyId], (err) => {
        if (err) {
          console.error('⚠️ Error updating views:', err);
        } else {
          console.log(`✅ Views updated for property ${propertyId}`);
        }
      });

      console.log(`✅ Property ${propertyId} detail sent with ${imagesResults.length} images`);
      res.json(response);
    });
  });
});


// ========== GET PROPERTY DETAIL BY ID (UNTUK MITRA DASHBOARD) ==========
app.get('/api/properties/:id', (req, res) => {
  const propertyId = req.params.id;
  
  console.log(`📥 Fetching property detail for ID: ${propertyId}`);

  // Query untuk mengambil detail properti
  const sql = `
    SELECT 
      p.*,
      c.name as city,
      cat.name as category_name,
      u.name as uploader_name,
      u.role as uploader_role,
      CASE 
        WHEN p.boosted_until > NOW() THEN 1 
        ELSE 0 
      END as is_boosted,
      CASE
        WHEN p.boosted_until > NOW() 
        THEN DATEDIFF(p.boosted_until, NOW())
        ELSE 0
      END as boost_days_remaining
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  db.query(sql, [propertyId], (err, propertyResults) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }

    if (propertyResults.length === 0) {
      console.log(`⚠️ Property ${propertyId} not found`);
      return res.status(404).json({ 
        error: 'Property not found',
        message: 'Properti yang Anda cari tidak ditemukan'
      });
    }

    const property = propertyResults[0];

    // Query untuk mengambil semua gambar properti
    const imagesSql = `
      SELECT image_path, is_primary, display_order
      FROM images 
      WHERE property_id = ?
      ORDER BY display_order
    `;

    db.query(imagesSql, [propertyId], (err, imagesResults) => {
      if (err) {
        console.error('❌ Error fetching images:', err);
        return res.status(500).json({ 
          error: 'Database error', 
          details: err.message 
        });
      }

      // ✅ Parse facilities jadi array
      let facilitiesArray = [];
      try {
        if (typeof property.facilities === 'string') {
          facilitiesArray = JSON.parse(property.facilities);
        } else if (Array.isArray(property.facilities)) {
          facilitiesArray = property.facilities;
        }
      } catch (e) {
        console.error('Error parsing facilities:', e);
        facilitiesArray = [];
      }

      // Format response
      const response = {
        id: property.id,
        title: property.title,
        nama: property.title,
        type: property.type,
        city: property.city,
        alamat: property.address,
        address: property.address,
        harga: Math.floor(property.price), // ✅ CONVERT ke integer untuk hilangkan .00
        price: Math.floor(property.price),
        price_unit: property.price_unit,
        priceUnit: property.price_unit,
        description: property.description,
        facilities: facilitiesArray, // ✅ Return as array
        owner_name: property.owner_name,
        ownerName: property.owner_name,
        owner_whatsapp: property.owner_whatsapp,
        whatsappNumber: property.owner_whatsapp,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        status: property.status,
        views: property.views,
        whatsapp_clicks: property.whatsapp_clicks,
        whatsappClicks: property.whatsapp_clicks,
        created_at: property.created_at,
        createdAt: property.created_at,
        category_name: property.category_name,
        uploader_name: property.uploader_name,
        uploaderName: property.uploader_name,
        uploader_role: property.uploader_role,
        uploaderRole: property.uploader_role,
        is_boosted: property.is_boosted,
        is_featured: property.is_featured || 0,
        boost_days_remaining: property.boost_days_remaining,
        boosted_until: property.boosted_until,
        images: imagesResults.map(img => img.image_path)
      };

      console.log(`✅ Property ${propertyId} detail sent with ${imagesResults.length} images`);
      res.json(response);
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
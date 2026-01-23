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

// ========== API GET PROPERTY BY ID (DETAIL) ==========
app.get('/api/rumah/:id', (req, res) => {
  const { id } = req.params;
  
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
    
    // ✅ AMBIL SEMUA FOTO DARI TABEL IMAGES
    const imagesSql = `
      SELECT image_path, is_primary, display_order 
      FROM images 
      WHERE property_id = ? 
      ORDER BY is_primary DESC, display_order ASC
    `;
    
    db.query(imagesSql, [id], (err, imagesResults) => {
      if (err) {
        console.error('Error fetching images:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const images = imagesResults.map(img => img.image_path);
      
      let facilities = [];
      if (row.facilities) {
        try {
          facilities = JSON.parse(row.facilities);
        } catch (e) {
          facilities = [];
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
        images: images, // ✅ DARI TABEL IMAGES
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
  const validPackages = [15, 30, 75, 150, 330];
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


// ========== API GET ALL PROPERTIES (UNTUK HALAMAN UTAMA) ==========
app.get('/api/rumah', (req, res) => {
  console.log('📋 Fetching all properties for homepage');
  
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
      p.created_at as createdAt
    FROM properties p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN cities ct ON p.city_id = ct.id
    WHERE p.status = 'available'
    ORDER BY p.is_featured DESC, p.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching properties:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      console.log('⚠️ No properties found in database');
      return res.json([]);
    }
    
    const propertyIds = results.map(r => r.id);
    
    const imagesSql = `
      SELECT property_id, image_path, is_primary, display_order 
      FROM images 
      WHERE property_id IN (${propertyIds.join(',')})
      ORDER BY is_primary DESC, display_order ASC
    `;
    
    db.query(imagesSql, (err, imagesResults) => {
      if (err) {
        console.error('❌ Error fetching images:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
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
      
      console.log(`✅ Fetched ${formatted.length} properties with images`);
      res.json(formatted);
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
const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedDocTypes = ['application/pdf'];
  
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true); 
  } else {
    callback(
      new Error(
        `Tipo de archivo no permitido: ${file.mimetype}. ` +
        `Solo se permiten imágenes (JPEG, PNG, WebP, GIF) y PDFs.`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const uploadSingle = upload.single('image');

const uploadFile = upload.single('file');

const uploadMultiple = upload.array('images', 5);

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. Tamaño máximo: 10MB' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Campo de archivo no esperado' 
      });
    }
    return res.status(400).json({ 
      error: `Error al subir archivo: ${err.message}` 
    });
  }
  
  if (err) {
    return res.status(400).json({ 
      error: err.message 
    });
  }
  
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadFile,
  uploadMultiple,
  handleMulterError
};

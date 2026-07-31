import multer from 'multer';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
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
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadSingle: RequestHandler = upload.single('image');
export const uploadFile: RequestHandler = upload.single('file');
export const uploadMultiple: RequestHandler = upload.array('images', 5);

export const handleMulterError = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'El archivo es demasiado grande. Tamaño máximo: 10MB' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Campo de archivo no esperado' });
      return;
    }
    res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
    return;
  }

  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }

  next();
};

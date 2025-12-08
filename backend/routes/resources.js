const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const http = require('http')
const https = require('https')
const { URL } = require('url')
const path = require('path')
const auth = require('../middleware/auth');
const { uploadFile, handleMulterError } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, userId } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const resources = await Resource.find(filter)
      .populate('userId', 'username avatar email')
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments(filter);

    res.status(200).json({
      resources,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener recursos:', error);
    res.status(500).json({ error: 'Error al obtener recursos' });
  }
});

router.get('/:resourceId/download', async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.params.id;
    const resource = await Resource.findById(resourceId)
    if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' })

    const fileUrl = resource.fileUrl
    if (!fileUrl) return res.status(404).json({ error: 'Archivo no disponible' })

    const parsed = new URL(fileUrl)
    const client = parsed.protocol === 'http:' ? http : https

    client.get(fileUrl, (proxRes) => {
      const contentType = proxRes.headers['content-type'] || 'application/octet-stream'

      let filename = resource.originalName || (resource.title || 'download')
      filename = filename.replace(/[^a-z0-9.\-_]/gi, '_')

      const hasExt = Boolean(path.extname(filename))
      if (!hasExt) {
        const extFromPath = path.extname(parsed.pathname)
        if (extFromPath && extFromPath.length <= 7) {
          filename = filename + extFromPath
        } else if (resource.type === 'pdf' || resource.type === 'guide') {
          filename = filename + '.pdf'
        }
      }

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      proxRes.pipe(res)
    }).on('error', (err) => {
      console.error('Error proxy download:', err)
      res.status(500).json({ error: 'Error descargando archivo' })
    })
  } catch (error) {
    console.error('Error en endpoint download:', error)
    res.status(500).json({ error: 'Error procesando descarga' })
  }
})

router.get('/:resourceId/open', async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.params.id;
    const resource = await Resource.findById(resourceId)
    if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' })

    const fileUrl = resource.fileUrl
    if (!fileUrl) return res.status(404).json({ error: 'Archivo no disponible' })

    const parsed = new URL(fileUrl)
    const client = parsed.protocol === 'http:' ? http : https

    client.get(fileUrl, (proxRes) => {
      let contentType = proxRes.headers['content-type'] || 'application/octet-stream'
      if (contentType === 'application/octet-stream' && (resource.type === 'pdf' || resource.type === 'guide')) {
        contentType = 'application/pdf'
      }
      res.setHeader('Content-Type', contentType)

      proxRes.pipe(res)
    }).on('error', (err) => {
      console.error('Error proxy open:', err)
      res.status(500).json({ error: 'Error abriendo archivo' })
    })
  } catch (error) {
    console.error('Error en endpoint open:', error)
    res.status(500).json({ error: 'Error procesando open' })
  }
})

router.get('/:resourceId', async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.params.id;
    const resource = await Resource.findById(resourceId)
      .populate('userId', 'username avatar email role');

    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    res.status(200).json({ resource });
  } catch (error) {
    console.error('Error al obtener recurso:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de recurso inválido' });
    }
    
    res.status(500).json({ error: 'Error al obtener recurso' });
  }
});

router.post(
  '/',
  auth,
  uploadFile,
  handleMulterError,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    
    body('type')
      .isIn(['pdf', 'image', 'guide'])
      .withMessage('Tipo inválido. Debe ser: pdf, image o guide'),
    
    body('category')
      .isIn(['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro'])
      .withMessage('Categoría inválida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, type, category } = req.body;

      if (!req.file) {
        return res.status(400).json({ 
          error: 'El archivo es requerido' 
        });
      }

      let resourceType = 'auto';
      if (type === 'pdf') {
        resourceType = 'raw'; 
      } else if (type === 'image') {
        resourceType = 'image';
      } else {
        resourceType = 'auto'; 
      }

      let fileUrl = '';
      try {
        const uploadOpts = { use_filename: true, unique_filename: false }
        const result = await uploadToCloudinary(
          req.file.buffer,
          'cryptohub/resources',
          resourceType,
          uploadOpts
        );
        fileUrl = result.secure_url;
      } catch (cloudError) {
        console.error('Error al subir archivo a Cloudinary:', cloudError);
        return res.status(500).json({ 
          error: 'Error al subir el archivo' 
        });
      }

      const newResource = new Resource({
        userId: req.userId,
        title,
        description,
        type,
        fileUrl,
        category,
        originalName: req.file && req.file.originalname ? req.file.originalname : undefined
      });

      await newResource.save();

      const populatedResource = await Resource.findById(newResource._id)
        .populate('userId', 'username avatar email');

      res.status(201).json({
        message: 'Recurso creado exitosamente',
        resource: populatedResource
      });
    } catch (error) {
      console.error('Error al crear recurso:', error);
      res.status(500).json({ error: 'Error al crear recurso' });
    }
  }
);

router.put(
  '/:resourceId',
  auth,
  uploadFile,
  handleMulterError,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    
    body('type')
      .optional()
      .isIn(['pdf', 'image', 'guide'])
      .withMessage('Tipo inválido'),
    
    body('category')
      .optional()
      .isIn(['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro'])
      .withMessage('Categoría inválida')
  ],
  async (req, res) => {
    try {
      const resourceId = req.params.resourceId || req.params.id;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const resource = await Resource.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      if (resource.userId.toString() !== req.userId.toString() && !['admin', 'owner'].includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'No tienes permisos para editar este recurso' 
        });
      }

      const { title, description, type, category } = req.body;
      if (title) resource.title = title;
      if (description) resource.description = description;
      if (type) resource.type = type;
      if (category) resource.category = category;

      if (req.file) {
        if (resource.fileUrl) {
          try {
            const urlParts = resource.fileUrl.split('/');
            const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
            
            const oldResourceType = resource.type === 'pdf' ? 'raw' : 'image';
            
            console.log('🗑️ Eliminando archivo anterior de Cloudinary:', folderAndFile);
            await deleteFromCloudinary(folderAndFile, oldResourceType);
          } catch (delError) {
            console.error('❌ Error al eliminar archivo anterior:', delError);
          }
        }

        try {
          const newType = req.body.type || resource.type;
          const resourceType = newType === 'pdf' ? 'raw' : (newType === 'image' ? 'image' : 'auto');
          const uploadOpts = { use_filename: true, unique_filename: false }
          const result = await uploadToCloudinary(
            req.file.buffer,
            'cryptohub/resources',
            resourceType,
            uploadOpts
          );
          resource.fileUrl = result.secure_url;
          resource.originalName = req.file && req.file.originalname ? req.file.originalname : resource.originalName
        } catch (cloudError) {
          console.error('Error al subir nuevo archivo:', cloudError);
          return res.status(500).json({ 
            error: 'Error al subir el nuevo archivo' 
          });
        }
      }

      await resource.save();

      const updatedResource = await Resource.findById(resource._id)
        .populate('userId', 'username avatar email');

      res.status(200).json({
        message: 'Recurso actualizado exitosamente',
        resource: updatedResource
      });
    } catch (error) {
      console.error('Error al actualizar recurso:', error);
      
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'ID de recurso inválido' });
      }
      
      res.status(500).json({ error: 'Error al actualizar recurso' });
    }
  }
);

router.delete('/:resourceId', auth, async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.params.id;
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    if (resource.userId.toString() !== req.userId.toString() && !['admin', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para eliminar este recurso' 
      });
    }

    if (resource.fileUrl) {
      try {
        const urlParts = resource.fileUrl.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
        
        const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
        
        console.log('🗑️ Eliminando de Cloudinary:', folderAndFile, `(${resourceType})`);
        await deleteFromCloudinary(folderAndFile, resourceType);
      } catch (delError) {
        console.error('❌ Error al eliminar archivo de Cloudinary:', delError);
      }
    }

    await Resource.findByIdAndDelete(resourceId);

    res.status(200).json({ 
      message: 'Recurso eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar recurso:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de recurso inválido' });
    }
    
    res.status(500).json({ error: 'Error al eliminar recurso' });
  }
});

module.exports = router;

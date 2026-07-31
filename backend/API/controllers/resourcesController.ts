import http from 'http';
import https from 'https';
import path from 'path';
import { URL } from 'url';
import { validationResult } from 'express-validator';
import type { Request, Response } from 'express';
import Resource from '../models/Resource';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';

export async function listResources(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '10', type, category, userId } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (type) filter['type'] = type;
    if (category) filter['category'] = category;
    if (userId) filter['userId'] = userId;

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
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener recursos:', error);
    res.status(500).json({ error: 'Error al obtener recursos' });
  }
}

export async function downloadResource(req: Request, res: Response): Promise<void> {
  try {
    const resourceId = req.params['resourceId'] ?? req.params['id'];
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }

    const fileUrl = resource.fileUrl;
    if (!fileUrl) {
      res.status(404).json({ error: 'Archivo no disponible' });
      return;
    }

    const parsed = new URL(fileUrl);
    const client = parsed.protocol === 'http:' ? http : https;

    client
      .get(fileUrl, (proxRes) => {
        const contentType = proxRes.headers['content-type'] || 'application/octet-stream';
        let filename = resource.originalName || resource.title || 'download';
        filename = filename.replace(/[^a-z0-9.\-_]/gi, '_');
        const hasExt = Boolean(path.extname(filename));
        if (!hasExt) {
          const extFromPath = path.extname(parsed.pathname);
          if (extFromPath && extFromPath.length <= 7) {
            filename = filename + extFromPath;
          } else if (resource.type === 'pdf' || resource.type === 'guide') {
            filename = filename + '.pdf';
          }
        }
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        proxRes.pipe(res);
      })
      .on('error', (err) => {
        console.error('Error proxy download:', err);
        res.status(500).json({ error: 'Error descargando archivo' });
      });
  } catch (error) {
    console.error('Error en endpoint download:', error);
    res.status(500).json({ error: 'Error procesando descarga' });
  }
}

export async function openResource(req: Request, res: Response): Promise<void> {
  try {
    const resourceId = req.params['resourceId'] ?? req.params['id'];
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }

    const fileUrl = resource.fileUrl;
    if (!fileUrl) {
      res.status(404).json({ error: 'Archivo no disponible' });
      return;
    }

    const parsed = new URL(fileUrl);
    const client = parsed.protocol === 'http:' ? http : https;

    client
      .get(fileUrl, (proxRes) => {
        let contentType = proxRes.headers['content-type'] || 'application/octet-stream';
        if (
          contentType === 'application/octet-stream' &&
          (resource.type === 'pdf' || resource.type === 'guide')
        ) {
          contentType = 'application/pdf';
        }
        res.setHeader('Content-Type', contentType);
        proxRes.pipe(res);
      })
      .on('error', (err) => {
        console.error('Error proxy open:', err);
        res.status(500).json({ error: 'Error abriendo archivo' });
      });
  } catch (error) {
    console.error('Error en endpoint open:', error);
    res.status(500).json({ error: 'Error procesando open' });
  }
}

export async function getResource(req: Request, res: Response): Promise<void> {
  try {
    const resourceId = req.params['resourceId'] ?? req.params['id'];
    const resource = await Resource.findById(resourceId).populate('userId', 'username avatar email role');

    if (!resource) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }

    res.status(200).json({ resource });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al obtener recurso:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de recurso inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al obtener recurso' });
  }
}

export async function createResource(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { title, description, type, category } = req.body as {
      title: string;
      description: string;
      type: string;
      category: string;
    };

    if (!req.file) {
      res.status(400).json({ error: 'El archivo es requerido' });
      return;
    }

    const resourceType = type === 'pdf' ? 'raw' : type === 'image' ? 'image' : 'auto';

    let fileUrl = '';
    try {
      const uploadOpts = { use_filename: true, unique_filename: false };
      const result = await uploadToCloudinary(req.file.buffer, 'cryptohub/resources', resourceType, uploadOpts);
      fileUrl = result.secure_url;
    } catch (cloudError) {
      console.error('Error al subir archivo a Cloudinary:', cloudError);
      res.status(500).json({ error: 'Error al subir el archivo' });
      return;
    }

    const newResource = new Resource({
      userId: req.userId,
      title,
      description,
      type,
      fileUrl,
      category,
      originalName: req.file.originalname ?? undefined,
    });

    await newResource.save();
    const populatedResource = await Resource.findById(newResource._id).populate('userId', 'username avatar email');

    res.status(201).json({ message: 'Recurso creado exitosamente', resource: populatedResource });
  } catch (error) {
    console.error('Error al crear recurso:', error);
    res.status(500).json({ error: 'Error al crear recurso' });
  }
}

export async function updateResource(req: Request, res: Response): Promise<void> {
  try {
    const resourceId = req.params['resourceId'] ?? req.params['id'];
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }

    if (
      resource.userId.toString() !== req.userId?.toString() &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'owner'
    ) {
      res.status(403).json({ error: 'No tienes permisos para editar este recurso' });
      return;
    }

    const { title, description, type, category } = req.body as {
      title?: string;
      description?: string;
      type?: string;
      category?: string;
    };

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (type) resource.type = type as typeof resource.type;
    if (category) resource.category = category as typeof resource.category;

    if (req.file) {
      if (resource.fileUrl) {
        try {
          const urlParts = resource.fileUrl.split('/');
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
          const oldResourceType = resource.type === 'pdf' ? 'raw' : 'image';
          await deleteFromCloudinary(folderAndFile, oldResourceType);
        } catch (delError) {
          console.error('❌ Error al eliminar archivo anterior:', delError);
        }
      }

      try {
        const newType = (req.body as { type?: string }).type ?? resource.type;
        const uploadType = newType === 'pdf' ? 'raw' : newType === 'image' ? 'image' : 'auto';
        const uploadOpts = { use_filename: true, unique_filename: false };
        const result = await uploadToCloudinary(req.file.buffer, 'cryptohub/resources', uploadType, uploadOpts);
        resource.fileUrl = result.secure_url;
        resource.originalName = req.file.originalname ?? resource.originalName;
      } catch (cloudError) {
        console.error('Error al subir nuevo archivo:', cloudError);
        res.status(500).json({ error: 'Error al subir el nuevo archivo' });
        return;
      }
    }

    await resource.save();
    const updatedResource = await Resource.findById(resource._id).populate('userId', 'username avatar email');
    res.status(200).json({ message: 'Recurso actualizado exitosamente', resource: updatedResource });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al actualizar recurso:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de recurso inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al actualizar recurso' });
  }
}

export async function deleteResource(req: Request, res: Response): Promise<void> {
  try {
    const resourceId = req.params['resourceId'] ?? req.params['id'];
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }

    if (
      resource.userId.toString() !== req.userId?.toString() &&
      !(['admin', 'owner'] as string[]).includes(req.user?.role ?? '')
    ) {
      res.status(403).json({ error: 'No tienes permisos para eliminar este recurso' });
      return;
    }

    if (resource.fileUrl) {
      try {
        const urlParts = resource.fileUrl.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
        const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
        await deleteFromCloudinary(folderAndFile, resourceType);
      } catch (delError) {
        console.error('❌ Error al eliminar archivo de Cloudinary:', delError);
      }
    }

    await Resource.findByIdAndDelete(resourceId);
    res.status(200).json({ message: 'Recurso eliminado exitosamente' });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al eliminar recurso:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de recurso inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al eliminar recurso' });
  }
}

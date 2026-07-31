import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiOptions } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

export function uploadToCloudinary(
  fileBuffer: Buffer,
  folder = 'cryptohub',
  resourceType: UploadApiOptions['resource_type'] = 'auto',
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const baseOptions: UploadApiOptions = {
      folder,
      resource_type: resourceType,
      transformation:
        resourceType === 'image'
          ? [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ]
          : undefined,
    };

    const uploadOpts: UploadApiOptions = { ...baseOptions, ...options };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOpts,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          // upload_stream callback garantiza result cuando no hay error
          resolve(result as UploadApiResponse);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: UploadApiOptions['resource_type'] = 'image'
): Promise<unknown> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Error al eliminar de Cloudinary:', error);
    throw error;
  }
}

export { cloudinary };

require('dotenv').config();
const { deleteFromCloudinary } = require('../config/cloudinary');

const deleteOrphanImage = async () => {
  try {
    console.log('🗑️ Intentando eliminar imagen huérfana...');
    
    const publicId = 'cryptohub/posts/c4vdbnni1rzy2vqwcqwb';
    
    const result = await deleteFromCloudinary(publicId, 'image');
    
    console.log('✅ Imagen eliminada:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al eliminar:', error);
    process.exit(1);
  }
};

deleteOrphanImage();

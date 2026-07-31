function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Variable de entorno requerida no encontrada: ${key}`);
    process.exit(1);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env['PORT'] ?? '5000', 10),
  NODE_ENV: (process.env['NODE_ENV'] ?? 'development') as 'development' | 'production' | 'test',
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  FRONTEND_URLS:
    process.env['FRONTEND_URLS'] ??
    process.env['FRONTEND_URL'] ??
    'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requireEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),
};

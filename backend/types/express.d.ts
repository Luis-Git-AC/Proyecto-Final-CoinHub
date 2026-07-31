// Augmentación global del namespace Express para añadir campos
// inyectados por el middleware de autenticación.
// Este fichero no tiene imports de nivel superior para permanecer
// como script global y que la augmentación sea visible en todo el proyecto.

declare namespace Express {
  interface Request {
    /** Usuario autenticado, disponible tras pasar por el middleware auth */
    user?: import('./models').IUser;
    /** _id del usuario autenticado (alias de conveniencia) */
    userId?: import('mongoose').Types.ObjectId;
  }
}

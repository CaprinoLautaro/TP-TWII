
import { rateLimit } from 'express-rate-limit';

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,

  message: {
    message: 'Demasiadas solicitudes. Intentá nuevamente en 15 minutos.'
  }
});

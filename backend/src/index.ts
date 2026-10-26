import cors from 'cors';
import express from 'express';
import { config } from './config/config';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';
import { apiRouter } from './routes';

const app = express();

// El frontend de Angular corre en el puerto 4200.
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '2mb' })); // las imágenes del formulario viajan como texto base64

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api', apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(config.port, () => {
  console.log(`API lista en http://localhost:${config.port}/api`);
});

import dotenv from 'dotenv';

dotenv.config({ quiet: true });

/** Variables de entorno en un solo lugar. En el resto del código se usa `config.algo`, no `process.env`. */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/patitas',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET ?? '',
};

-- CreateEnum
CREATE TYPE "Mascota" AS ENUM ('PERRO', 'GATO', 'AMBOS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "mascota" "Mascota" NOT NULL DEFAULT 'AMBOS';

-- Los productos que ya existían: se deduce por el nombre (el resto queda en AMBOS)
UPDATE "Product" SET "mascota" = 'PERRO'
WHERE "nombre" ILIKE '%perro%' AND "nombre" NOT ILIKE '%gato%';

UPDATE "Product" SET "mascota" = 'GATO'
WHERE "nombre" ILIKE '%gato%' AND "nombre" NOT ILIKE '%perro%';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "metodoPago" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ultimosDigitosTarjeta" TEXT;

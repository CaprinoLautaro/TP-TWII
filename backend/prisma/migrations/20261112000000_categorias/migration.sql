-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- Categorías que ya existían, más las que ya usen los productos cargados
INSERT INTO "Categoria" ("nombre") VALUES
    ('Alimento'), ('Juguetes'), ('Accesorios'), ('Higiene'), ('Camas');

INSERT INTO "Categoria" ("nombre")
SELECT DISTINCT "clasificacion" FROM "Product"
WHERE "clasificacion" NOT IN (SELECT "nombre" FROM "Categoria");

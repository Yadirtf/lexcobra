-- AlterTable
ALTER TABLE "planes" ALTER COLUMN "limitUsuarios" DROP DEFAULT;

-- CreateTable
CREATE TABLE "informacion_juzgados" (
    "id" TEXT NOT NULL,
    "juzgadoId" TEXT NOT NULL,
    "departamentoId" TEXT,
    "municipioId" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "correo" TEXT,

    CONSTRAINT "informacion_juzgados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "informacion_juzgados_juzgadoId_key" ON "informacion_juzgados"("juzgadoId");

-- AddForeignKey
ALTER TABLE "informacion_juzgados" ADD CONSTRAINT "informacion_juzgados_juzgadoId_fkey" FOREIGN KEY ("juzgadoId") REFERENCES "juzgados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacion_juzgados" ADD CONSTRAINT "informacion_juzgados_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacion_juzgados" ADD CONSTRAINT "informacion_juzgados_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

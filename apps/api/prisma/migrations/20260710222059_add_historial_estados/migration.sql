-- CreateTable
CREATE TABLE "historial_estados_obligacion" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "estadoAnteriorId" TEXT,
    "estadoNuevoId" TEXT,
    "nivelRecuperacionAnteriorId" TEXT,
    "nivelRecuperacionNuevoId" TEXT,
    "usuarioId" TEXT,
    "observacion" TEXT,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_estados_obligacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_estados_obligacion_obligacionId_idx" ON "historial_estados_obligacion"("obligacionId");

-- AddForeignKey
ALTER TABLE "historial_estados_obligacion" ADD CONSTRAINT "historial_estados_obligacion_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "obligaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados_obligacion" ADD CONSTRAINT "historial_estados_obligacion_estadoAnteriorId_fkey" FOREIGN KEY ("estadoAnteriorId") REFERENCES "estados_obligacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados_obligacion" ADD CONSTRAINT "historial_estados_obligacion_estadoNuevoId_fkey" FOREIGN KEY ("estadoNuevoId") REFERENCES "estados_obligacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados_obligacion" ADD CONSTRAINT "historial_estados_obligacion_nivelRecuperacionAnteriorId_fkey" FOREIGN KEY ("nivelRecuperacionAnteriorId") REFERENCES "niveles_recuperacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados_obligacion" ADD CONSTRAINT "historial_estados_obligacion_nivelRecuperacionNuevoId_fkey" FOREIGN KEY ("nivelRecuperacionNuevoId") REFERENCES "niveles_recuperacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados_obligacion" ADD CONSTRAINT "historial_estados_obligacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

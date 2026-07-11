-- CreateTable
CREATE TABLE "auditoria_obligaciones" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "campoModificado" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "usuarioId" TEXT,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_obligaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_obligaciones_obligacionId_idx" ON "auditoria_obligaciones"("obligacionId");

-- AddForeignKey
ALTER TABLE "auditoria_obligaciones" ADD CONSTRAINT "auditoria_obligaciones_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "obligaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_obligaciones" ADD CONSTRAINT "auditoria_obligaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

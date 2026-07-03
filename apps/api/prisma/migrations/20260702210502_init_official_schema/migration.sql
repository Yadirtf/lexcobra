-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(12,2) NOT NULL,
    "duracionMeses" INTEGER NOT NULL,
    "limitUsuarios" INTEGER NOT NULL DEFAULT 5,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_cliente" (
    "id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "estados_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "subdominio" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "departamentoId" TEXT,
    "municipioId" TEXT,
    "estadoId" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_suscripciones" (
    "id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "estados_suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "planId" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estadoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombreRol" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "nombreCargo" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "identificacion" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "telefono" TEXT,
    "cargoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carteras" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombreEntidad" TEXT NOT NULL,
    "nit" TEXT,
    "representante" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "observaciones" TEXT,
    "logoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carteras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_identificacion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tipos_identificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoIdentificacionId" TEXT,
    "numeroIdentificacion" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_contacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tipos_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas_contactos" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "tipoContactoId" TEXT,
    "valor" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "personas_contactos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "juzgados" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "juzgados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medidas_cautelares" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "medidas_cautelares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_obligacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "estados_obligacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveles_recuperacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "niveles_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligaciones" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "carteraId" TEXT,
    "numeroCredito" TEXT NOT NULL,
    "numeroPagare" TEXT,
    "saldoCapitalDemandado" DECIMAL(15,2) NOT NULL,
    "departamentoId" TEXT,
    "municipioId" TEXT,
    "fechaReparto" TIMESTAMP(3),
    "fechaPresentacionDemanda" TIMESTAMP(3),
    "juzgadoId" TEXT,
    "radicado" TEXT,
    "medidaCautelarId" TEXT,
    "mandamientoPagoFecha" TIMESTAMP(3),
    "autoSeguirEjecucionFecha" TIMESTAMP(3),
    "liquidacionCreditoAprobadaFecha" TIMESTAMP(3),
    "estadoObligacionId" TEXT,
    "nivelRecuperacionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obligaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_actores" (
    "id" TEXT NOT NULL,
    "nombreRol" TEXT NOT NULL,

    CONSTRAINT "roles_actores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obligacion_actores" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "rolActorId" TEXT,

    CONSTRAINT "obligacion_actores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_medidas" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "medidaCautelarId" TEXT,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_medidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "destinatarioPersonaId" TEXT,
    "fechaNotificacion" TIMESTAMP(3) NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recaudos" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "fechaAbonada" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recaudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora_observaciones" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "observacion" TEXT NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_observaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_configs" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "carteraId" TEXT,
    "periodType" "PeriodType" NOT NULL DEFAULT 'QUARTERLY',
    "periodDays" INTEGER,
    "nextReportDate" TIMESTAMP(3),
    "hiddenColumns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "carteraId" TEXT,
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "params" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_links" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "reportSnapshotId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipios_departamentoId_nombre_key" ON "municipios"("departamentoId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_nit_key" ON "clientes"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_subdominio_key" ON "clientes"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_clienteId_correo_key" ON "usuarios"("clienteId", "correo");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuarioId_key" ON "empleados"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_clienteId_identificacion_key" ON "empleados"("clienteId", "identificacion");

-- CreateIndex
CREATE INDEX "carteras_clienteId_idx" ON "carteras"("clienteId");

-- CreateIndex
CREATE INDEX "personas_clienteId_idx" ON "personas"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "personas_clienteId_tipoIdentificacionId_numeroIdentificacio_key" ON "personas"("clienteId", "tipoIdentificacionId", "numeroIdentificacion");

-- CreateIndex
CREATE INDEX "juzgados_clienteId_idx" ON "juzgados"("clienteId");

-- CreateIndex
CREATE INDEX "obligaciones_clienteId_idx" ON "obligaciones"("clienteId");

-- CreateIndex
CREATE INDEX "obligaciones_carteraId_idx" ON "obligaciones"("carteraId");

-- CreateIndex
CREATE INDEX "obligaciones_clienteId_carteraId_idx" ON "obligaciones"("clienteId", "carteraId");

-- CreateIndex
CREATE UNIQUE INDEX "obligacion_actores_obligacionId_personaId_rolActorId_key" ON "obligacion_actores"("obligacionId", "personaId", "rolActorId");

-- CreateIndex
CREATE INDEX "notificaciones_obligacionId_idx" ON "notificaciones"("obligacionId");

-- CreateIndex
CREATE INDEX "recaudos_obligacionId_idx" ON "recaudos"("obligacionId");

-- CreateIndex
CREATE INDEX "bitacora_observaciones_obligacionId_idx" ON "bitacora_observaciones"("obligacionId");

-- CreateIndex
CREATE INDEX "report_snapshots_clienteId_idx" ON "report_snapshots"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "report_links_token_key" ON "report_links"("token");

-- CreateIndex
CREATE INDEX "report_links_token_idx" ON "report_links"("token");

-- AddForeignKey
ALTER TABLE "municipios" ADD CONSTRAINT "municipios_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "estados_cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "estados_suscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteras" ADD CONSTRAINT "carteras_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_tipoIdentificacionId_fkey" FOREIGN KEY ("tipoIdentificacionId") REFERENCES "tipos_identificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas_contactos" ADD CONSTRAINT "personas_contactos_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas_contactos" ADD CONSTRAINT "personas_contactos_tipoContactoId_fkey" FOREIGN KEY ("tipoContactoId") REFERENCES "tipos_contacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "juzgados" ADD CONSTRAINT "juzgados_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "carteras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_juzgadoId_fkey" FOREIGN KEY ("juzgadoId") REFERENCES "juzgados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_medidaCautelarId_fkey" FOREIGN KEY ("medidaCautelarId") REFERENCES "medidas_cautelares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_estadoObligacionId_fkey" FOREIGN KEY ("estadoObligacionId") REFERENCES "estados_obligacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligaciones" ADD CONSTRAINT "obligaciones_nivelRecuperacionId_fkey" FOREIGN KEY ("nivelRecuperacionId") REFERENCES "niveles_recuperacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligacion_actores" ADD CONSTRAINT "obligacion_actores_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "obligaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligacion_actores" ADD CONSTRAINT "obligacion_actores_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obligacion_actores" ADD CONSTRAINT "obligacion_actores_rolActorId_fkey" FOREIGN KEY ("rolActorId") REFERENCES "roles_actores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_medidas" ADD CONSTRAINT "historial_medidas_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "obligaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_medidas" ADD CONSTRAINT "historial_medidas_medidaCautelarId_fkey" FOREIGN KEY ("medidaCautelarId") REFERENCES "medidas_cautelares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "obligaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_destinatarioPersonaId_fkey" FOREIGN KEY ("destinatarioPersonaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaudos" ADD CONSTRAINT "recaudos_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "obligaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaudos" ADD CONSTRAINT "recaudos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_observaciones" ADD CONSTRAINT "bitacora_observaciones_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "obligaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_observaciones" ADD CONSTRAINT "bitacora_observaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_configs" ADD CONSTRAINT "report_configs_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_configs" ADD CONSTRAINT "report_configs_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "carteras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "carteras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_reportSnapshotId_fkey" FOREIGN KEY ("reportSnapshotId") REFERENCES "report_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_links" ADD CONSTRAINT "report_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

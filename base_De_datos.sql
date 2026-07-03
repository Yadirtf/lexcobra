-- =============================================================================
-- 0. MÓDULO GEOGRÁFICO (REQUISITO PARA INTEGRIDAD DE BUSCADORES)
-- =============================================================================

CREATE TABLE departamentos (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE municipios (
    id INT PRIMARY KEY,
    departamento_id INT REFERENCES departamentos(id),
    nombre VARCHAR(100) NOT NULL
);

-- =============================================================================
-- 1. MÓDULO DE SUSCRIPCIONES Y SAAS (CONTROL DEL SERVICIO)
-- =============================================================================

CREATE TABLE planes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL,
    duracion_meses INT NOT NULL, -- 6 para semestral, 12 para anual
    limit_usuarios INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE estados_cliente (
    id SERIAL PRIMARY KEY,
    estado VARCHAR(30) NOT NULL, -- Activo, Inactivo
    descripcion TEXT
);

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nit VARCHAR(20) UNIQUE NOT NULL,
    nombre_comercial VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(150),
    departamento_id INT REFERENCES departamentos(id), 
    municipio_id INT REFERENCES municipios(id),    
    estado_id INT REFERENCES estados_cliente(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estados_suscripciones (
    id SERIAL PRIMARY KEY,
    estado VARCHAR(30) NOT NULL, -- Activa, Suspendida, Vencida, Demo
    descripcion TEXT
);

CREATE TABLE suscripciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    plan_id INT REFERENCES planes(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado_id INT REFERENCES estados_suscripciones(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. MÓDULO DE USUARIOS, EMPLEADOS Y ROLES (INTERNO DEL TENANT)
-- =============================================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL, -- Dueño del sistema, administrador(cliente al que se le vende suscripción), usuario(empleados del cliente)
    descripcion TEXT
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE, -- Tenant Aislado
    correo VARCHAR(100) NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- Hash BCrypt o Argon2
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT uniq_correo_por_cliente UNIQUE (cliente_id, correo)
);

CREATE TABLE usuario_roles (
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

-- Nueva Tabla solicitada: Empleados / Personal administrativo del Tenant

CREATE TABLE cargos(
    id SERIAL PRIMARY KEY,
    nombre_cargo VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL, -- Vinculo opcional a sus credenciales
    identificacion VARCHAR(20) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    cargo_id INT REFERENCES cargos(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_identificacion_empleado_tenant UNIQUE (cliente_id, identificacion)
);

-- =============================================================================
-- 3. MÓDULO CORE DE COBRANZAS (PROCESOS JURÍDICOS)
-- =============================================================================

CREATE TABLE carteras (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE, 
    nombre_entidad VARCHAR(150) NOT NULL,
    nit VARCHAR(20),
    representante VARCHAR(100),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    observaciones TEXT,
    logo_url TEXT,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE tipos_identificacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL, -- CC, CE, NIT, PAP
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    tipo_identificacion_id INT REFERENCES tipos_identificacion(id),
    numero_identificacion VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    CONSTRAINT uniq_persona_cliente UNIQUE (cliente_id, tipo_identificacion_id, numero_identificacion)
);

CREATE TABLE tipos_contacto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL -- Teléfono, Correo, Celular
);

CREATE TABLE personas_contactos (
    id SERIAL PRIMARY KEY,
    persona_id INT REFERENCES personas(id) ON DELETE CASCADE,
    tipo_contacto_id INT REFERENCES tipos_contacto(id),
    valor VARCHAR(150) NOT NULL, 
    es_principal BOOLEAN DEFAULT FALSE
);

CREATE TABLE juzgados (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE, 
    nombre VARCHAR(150) NOT NULL
);

CREATE TABLE medidas_cautelares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE estados_obligacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE niveles_recuperacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- Tabla Principal de Créditos / Obligaciones
CREATE TABLE obligaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    cartera_id INT REFERENCES carteras(id),
    numero_credito VARCHAR(50) NOT NULL,
    numero_pagare VARCHAR(50),
    saldo_capital_demandado NUMERIC(15, 2) NOT NULL,
    departamento_id INT REFERENCES departamentos(id), 
    municipio_id INT REFERENCES municipios(id),
    
    -- Proceso Jurídico
    fecha_presentacion_demanda DATE,
    juzgado_id INT REFERENCES juzgados(id),
    radicado VARCHAR(50),
    medida_cautelar_id INT REFERENCES medidas_cautelares(id),
    mandamiento_pago_fecha DATE,
    auto_seguir_ejecucion_fecha DATE,
    liquidacion_credito_aprobada_fecha DATE,
    
    -- Estados
    estado_obligacion_id INT REFERENCES estados_obligacion(id),
    nivel_recuperacion_id INT REFERENCES niveles_recuperacion(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tipos de roles para los actores (Deudor Principal, Codeudor, etc.)
CREATE TABLE roles_actores (
    id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL -- 'Deudor Principal', 'Deudor Solidario', 'Codeudor'
);

-- Tabla intermedia mejorada para asociar e identificar Deudores y Codeudores
CREATE TABLE obligacion_actores (
    id SERIAL PRIMARY KEY,
    obligacion_id INT REFERENCES obligaciones(id) ON DELETE CASCADE,
    persona_id INT REFERENCES personas(id),
    rol_actor_id INT REFERENCES roles_actores(id), 
    CONSTRAINT uniq_actor_obligacion UNIQUE (obligacion_id, persona_id, rol_actor_id)
);

-- Historial de Medidas Cautelares
CREATE TABLE historial_medidas (
    id SERIAL PRIMARY KEY,
    obligacion_id INT REFERENCES obligaciones(id) ON DELETE CASCADE,
    medida_cautelar_id INT REFERENCES medidas_cautelares(id),
    fecha_evento DATE NOT NULL, 
    observacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    obligacion_id INT REFERENCES obligaciones(id) ON DELETE CASCADE,
    destinatario_persona_id INT REFERENCES personas(id), 
    fecha_notificacion DATE NOT NULL,
    observacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. RECAUDOS Y BITÁCORAS (MÉTRICAS Y SEGUIMIENTO)
-- =============================================================================

CREATE TABLE recaudos (
    id SERIAL PRIMARY KEY,
    obligacion_id INT REFERENCES obligaciones(id) ON DELETE CASCADE,
    fecha_abonada DATE NOT NULL,
    monto NUMERIC(15, 2) NOT NULL,
    usuario_id INT REFERENCES usuarios(id), -- Usuario que procesa el pago
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bitacora_observaciones (
    id SERIAL PRIMARY KEY,
    obligacion_id INT REFERENCES obligaciones(id) ON DELETE CASCADE,
    observacion TEXT NOT NULL,
    usuario_id INT REFERENCES usuarios(id), -- Asesor que registra el seguimiento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
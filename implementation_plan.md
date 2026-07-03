# 🏛️ Plan del Sistema v2 — SaaS de Cobranza Jurídica Multi-Tenant

> **Versión 2** — Incorpora todos los comentarios y respuestas del cliente.
> Estado: **Pendiente de aprobación final antes de implementación.**

---

## Contexto y Alcance Real del Sistema

El sistema es un **SaaS especializado** en gestión jurídica de cobranza. La primera implementación se hace con los datos y flujo de **Casa de Cobranzas del Putumayo E.U.** (primer tenant/cliente), pero la plataforma está diseñada para venderse a **cualquier empresa de cobranza**.

### El modelo correcto de 3 niveles

```
┌──────────────────────────────────────────────────────────────────┐
│  PLATAFORMA SaaS (tú — Super Admin)                             │
│  Administras tenants, suscripciones y la infraestructura global  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ vende el servicio a
        ┌──────────────────▼──────────────────────┐
        │  TENANT = Empresa de Cobranza           │
        │  Ej: "Casa de Cobranzas del Putumayo"   │
        │  Accede por: putumayo.tuapp.com          │
        └──────────────────┬──────────────────────┘
                           │ administra
        ┌──────────────────▼──────────────────────┐
        │  CARTERA = Entidad que entrega deudas   │
        │  Ej: FOGADE, FINAGRO, ICETEX            │
        │  (el cliente del tenant)                 │
        └──────────────────┬──────────────────────┘
                           │ contiene
        ┌──────────────────▼──────────────────────┐
        │  OBLIGACIÓN = Deuda individual           │
        │  Deudor + proceso jurídico completo     │
        └─────────────────────────────────────────┘
```

---

## 1. Lógica de Negocio Detallada

### 1.1 Actores y Roles

```
┌─────────────────────────────────────────────────────────┐
│                SUPER ADMIN (tú)                         │
│  • CRUD de Tenants (empresas de cobranza)               │
│  • Gestión de suscripciones y planes                    │
│  • Vista global de métricas del sistema                 │
│  • Acceso a cualquier tenant en modo soporte            │
└───────────────────────┬─────────────────────────────────┘
                        │ por cada tenant
   ┌────────────────────┼────────────────────────────┐
   │                    │                            │
   ▼                    ▼                            ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐
│ REPRESENTANTE│  │   EMPLEADO    │  │    VISUALIZADOR      │
│    LEGAL     │  │ (Abogado/Aux) │  │  (Solo reportes)     │
│              │  │               │  │                      │
│ • Full CRUD  │  │ • CRUD todas  │  │ • Ve reportes        │
│ • Crea users │  │   las carteras│  │ • Descarga PDF/Excel │
│ • Config     │  │   del tenant  │  │ • Abre links         │
│   asignación │  │ • Puede ser   │  │   compartidos        │
│   carteras   │  │   restringido │  │ • Sin edición        │
│ • Reportes   │  │   por Rep.    │  │                      │
│ • Config     │  │   Legal       │  │                      │
│   periodos   │  │ • Bitácora    │  │                      │
└──────────────┘  └───────────────┘  └──────────────────────┘
```

### 1.2 Flujo de Negocio Completo

```
[Super Admin] Registra nuevo Tenant
       ↓
       Asigna plan de suscripción + configura subdominio
       ↓
[Rep. Legal] Configura su espacio de trabajo
       ↓
       • Crea sus usuarios (empleados, visualizadores)
       • Define el periodo de reporte (ej: cada 3 meses)
       • Configura si empleados acceden a todas las carteras
         o si se asignan carteras específicas
       ↓
[Empleados] Gestionan carteras y obligaciones
       ↓
       • Registran deudores, codeudores, proceso jurídico
       • Actualizan estados del proceso
       • Registran abonos / recaudos
       • Añaden notas a la bitácora
       ↓
[Al vencer el periodo o a demanda]
Generación de Reporte del período configurado
       ↓
       • Incluye TODAS las obligaciones (datos completos)
       • Opción de personalizar qué campos mostrar
       • Acotado al rango de fechas del período elegido
       ↓
Compartir reporte:
       🔗 Link temporal  |  📊 Excel  |  📄 PDF
```

### 1.3 Gestión de Juzgados (CRUD)

Los juzgados son una **entidad de primer nivel** dentro de cada tenant, con CRUD completo:

- Registrar nuevo juzgado (nombre, ciudad, tipo)
- Editar datos de un juzgado existente
- Ver todos los procesos (obligaciones) vinculados a un juzgado
- Desactivar un juzgado (soft-delete, no se pierde el historial)
- Vista de panel dual: lista de juzgados ← → procesos del juzgado seleccionado

---

## 2. Datos a Registrar

### 2.1 Entidades del sistema (normalizadas)

Todas las entidades clave tendrán su propia tabla, sin campos `VARCHAR` que dupliquen lo que debería ser una relación.

```
── Plataforma (schema público / global)
   tenants              → Empresa de cobranza (el tenant)
   subscriptions        → Plan activo de cada tenant
   super_admin_users    → Solo el super admin

── Por Tenant (schema compartido con tenant_id)
   users                → Usuarios del tenant (con rol)
   user_portfolio_access→ Asignación opcional cartera ↔ usuario
   
   portfolios           → Carteras (entidades que entregan deudas)
   
   obligations          → Obligaciones (proceso de cobranza)
   persons              → Personas: deudores y codeudores (sin duplicar)
   obligation_persons   → Relación obligación ↔ persona (con rol: deudor/codeudor)
   contacts             → Contactos de cada persona (teléfono, correo, etc.)
   
   courts               → Juzgados del tenant (CRUD)
   
   ── Catálogos normalizados (entidades propias, no enums)
   obligation_statuses  → Estados del proceso (TERMINADO, PERSUASIVO...)
   precautionary_measures → Medidas cautelares (EMBARGO Y SECUESTRO...)
   seizure_types        → Tipos de secuestro/retención/remate
   recovery_levels      → Niveles de recuperación (ALTO, MEDIO, BAJO)
   municipalities       → Municipios (tabla maestra)
   notification_types   → Tipos de notificación
   contact_types        → Tipos de contacto (celular, correo, etc.)

   notifications        → Notificaciones del proceso (fecha, tipo, persona)
   recoveries           → Recaudos/abonos registrados
   notes                → Bitácora de observaciones

   ── Reportes
   report_configs       → Configuración del período por tenant/cartera
   report_snapshots     → Reportes generados (metadata + parámetros)
   report_links         → Links temporales para compartir reportes
```

### 2.2 Obligación — datos completos (basado en el Excel real de FOGADE 2026)

Del análisis del archivo `1 informe JURIDICO - FOGADE 2026`, las columnas del reporte real son:

| # | Campo en Excel | Campo en sistema |
|---|----------------|-----------------|
| 1 | ÍTEM | Número correlativo |
| 2 | Nº IDENTIFICACIÓN DEUDOR | `cedula` (en `persons`) |
| 3 | NOMBRES DEUDOR(ES) | `full_name` (en `persons`) |
| 4 | NOMBRES CODEUDOR(ES) - Nº ID | Relación `obligation_persons` tipo codeudor |
| 5 | FECHA REPARTO DE INGRESO | `intake_date` en `obligations` |
| 6 | Nro. CRÉDITO FOGADE | `credit_number` |
| 7 | Nro. PAGARÉ | `promissory_note_number` |
| 8 | SALDO CAPITAL DEMANDADO | `capital_balance` |
| 9 | MUNICIPIO | FK → `municipalities` |
| 10 | PRESENTACIÓN DEMANDA | `lawsuit_date` |
| 11 | JUZGADO | FK → `courts` |
| 12 | RADICADO | `docket_number` |
| 13 | MEDIDA CAUTELAR SOLICITADA | FK → `precautionary_measures` |
| 14 | MANDAMIENTO DE PAGO | `payment_order_date` |
| 15 | NOTIFICACIÓN | Relación → `notifications` |
| 16 | AUTO SEGUIR ADELANTE EJECUCIÓN | `proceed_execution_date` |
| 17 | LIQUIDACIÓN CRÉDITO APROBADA | `credit_liquidation_date` |
| 18 | FECHA SECUESTRO/RETENCIÓN/REMATES | FK → `seizure_types` + fecha |
| 19 | ESTADO ACTUAL | FK → `obligation_statuses` |
| 20 | TOTAL RECAUDO / ABONOS | Sumatoria de `recoveries` |
| 21 | OBSERVACIÓN | Bitácora concatenada (`notes`) |
| 22 | NIVEL DE RECUPERACIÓN | FK → `recovery_levels` |

> **Nota**: El Excel real incluye el logo de la empresa (FOGADE), encabezado con nombre de abogada, nombre del tenant y fecha de corte. Todo esto se replica en el PDF/Excel generado por el sistema.

---

## 3. Normalización y Principios de Base de Datos

### 3.1 Principio rector

> **Ningún valor repetible debe almacenarse como texto libre si puede ser una relación.** Los catálogos (estados, medidas, juzgados, niveles, municipios) son tablas propias con sus IDs. Las obligaciones los referencian por FK.

### 3.2 Estrategia Multi-Tenant

**✅ Decisión: Shared Schema con `tenant_id`**

Una sola base de datos, un solo schema, todas las tablas tienen columna `tenant_id`. PostgreSQL Row-Level Security (RLS) garantiza el aislamiento a nivel de BD.

```
Ventajas:
  ✅ Migraciones únicas (un solo schema que evoluciona)
  ✅ Menor costo operativo (no crear schemas dinámicamente)
  ✅ Consultas globales del Super Admin sin UNION entre schemas
  ✅ Más sencillo con Prisma ORM
  
Seguridad compensatoria:
  ✅ RLS en PostgreSQL: cada query filtra automáticamente por tenant_id
  ✅ Middleware en API: valida que tenant del JWT coincide con tenant de la operación
  ✅ Validación doble: capa de aplicación + capa de base de datos
```

### 3.3 Estrategia de IDs

- **UUID v4** para todas las entidades (no secuenciales, seguros para URLs públicas)
- Índices compuestos en `(tenant_id, id)` para performance

---

## 4. Base de Datos — PostgreSQL 16

### ¿Por qué PostgreSQL?

| Capacidad | Beneficio directo |
|-----------|------------------|
| **Row-Level Security** | Aislamiento multi-tenant a nivel de motor |
| **UUID nativo** | IDs seguros para links públicos de reportes |
| **Full-Text Search** | Búsqueda por nombre, cédula, radicado sin Elasticsearch |
| **JSONB** | Metadata flexible de reportes sin romper schema |
| **Transacciones ACID** | Operaciones de cartera y recaudo 100% confiables |
| **pg_trgm** | Búsqueda difusa (tolera errores de escritura en cédulas) |

---

## 5. Stack Tecnológico

### 5.1 Backend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **Node.js** | 22 LTS | Runtime principal |
| **TypeScript** | 5.x | Tipado estricto en todo el backend |
| **Fastify** | 5.x | Framework HTTP (más rápido que Express, schema-first) |
| **Prisma ORM** | 5.x | Acceso a datos con migraciones versionadas |
| **Zod** | 3.x | Validación de inputs + DTOs compartidos |
| **Jose / Fast-JWT** | — | Manejo de JWT sin dependencias pesadas |
| **ExcelJS** | 4.x | Generación de Excel (.xlsx) con formato y logo |
| **@react-pdf/renderer** | 3.x | Generación de PDF con diseño corporativo |
| **Nanoid** | 5.x | Tokens únicos para links de reportes |
| **Redis (ioredis)** | — | Rate limiting, blacklist de tokens, cache de sesiones |
| **Pino** | — | Logging estructurado de alta performance |

### 5.2 Frontend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.x | Tipado end-to-end |
| **Vite** | 5.x | Build tool ultrarrápido |
| **TanStack Router** | 1.x | Routing con tipado completo (mejor que React Router para TS) |
| **TanStack Query** | 5.x | Cache, estados de carga/error, sincronización server state |
| **Zustand** | 4.x | Estado de UI (sidebar, filtros activos, etc.) |
| **Shadcn/UI + Radix** | — | Componentes accesibles sin estilos impuestos |
| **Vanilla CSS / CSS Modules** | — | Control total sobre la identidad visual premium |
| **Recharts** | 2.x | Gráficas para dashboard y reportes |

### 5.3 Infraestructura

| Componente | Tecnología |
|-----------|-----------|
| Contenedores | Docker + Docker Compose |
| Reverse proxy | Nginx (manejo de subdominios `*.tuapp.com`) |
| Base de datos | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| Deploy inicial | Railway o Render (económico, escalable) |
| CI/CD | GitHub Actions |
| Monorepo | Turborepo (`apps/api` + `apps/web` + `packages/shared`) |

---

## 6. Arquitectura Limpia

### 6.1 Backend — Clean Architecture

```
apps/api/src/
│
├── core/                        ← DOMINIO (sin dependencias externas)
│   ├── entities/                ← Clases de negocio puras
│   │   ├── Tenant.ts
│   │   ├── Portfolio.ts
│   │   ├── Obligation.ts
│   │   ├── Person.ts
│   │   └── Report.ts
│   ├── repositories/            ← Interfaces (contratos)
│   │   ├── IPortfolioRepository.ts
│   │   ├── IObligationRepository.ts
│   │   └── IReportRepository.ts
│   └── use-cases/               ← Reglas de negocio (casos de uso)
│       ├── obligations/
│       │   ├── CreateObligationUseCase.ts
│       │   ├── UpdateObligationStatusUseCase.ts
│       │   └── RegisterRecoveryUseCase.ts
│       ├── reports/
│       │   ├── GenerateReportUseCase.ts
│       │   ├── CreateReportLinkUseCase.ts
│       │   └── ExportToExcelUseCase.ts
│       └── courts/
│           └── ManageCourtUseCase.ts
│
├── application/                 ← APLICACIÓN (orquesta casos de uso)
│   ├── dtos/                    ← Schemas Zod para validación
│   │   ├── obligation.dto.ts
│   │   ├── report.dto.ts
│   │   └── court.dto.ts
│   └── services/                ← Servicios de aplicación
│       ├── TenantResolverService.ts
│       ├── ReportGeneratorService.ts
│       └── SubdomainService.ts
│
├── infrastructure/              ← INFRAESTRUCTURA (implementaciones)
│   ├── database/
│   │   ├── schema.prisma        ← Schema central
│   │   ├── migrations/          ← Migraciones versionadas
│   │   └── seed.ts              ← Datos iniciales
│   ├── repositories/            ← Implementaciones Prisma
│   │   ├── PrismaPortfolioRepository.ts
│   │   └── PrismaObligationRepository.ts
│   └── services/
│       ├── ExcelExportService.ts
│       ├── PdfExportService.ts
│       └── RedisService.ts
│
├── presentation/                ← PRESENTACIÓN (HTTP)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── portfolios.routes.ts
│   │   ├── obligations.routes.ts
│   │   ├── courts.routes.ts
│   │   ├── reports.routes.ts
│   │   └── admin.routes.ts
│   ├── controllers/
│   ├── middlewares/
│   │   ├── auth.middleware.ts       ← JWT decode + user attach
│   │   ├── rbac.middleware.ts       ← Validación de rol por ruta
│   │   └── tenant.middleware.ts     ← Resuelve tenant desde subdominio
│   └── plugins/                     ← Plugins Fastify
│
└── shared/
    ├── errors/                      ← AppError, NotFoundError, ForbiddenError...
    ├── types/                       ← Tipos TS compartidos
    └── utils/                       ← formatCurrency, pagination, dates
```

### 6.2 Frontend — Feature-Sliced Design

```
apps/web/src/
│
├── app/                         ← Configuración global
│   ├── Router.tsx               ← Rutas con guards por rol
│   ├── Providers.tsx            ← QueryClient, Auth, Tenant
│   └── globals.css              ← Design tokens CSS
│
├── features/                    ← Módulos por dominio
│   ├── auth/                    ← Login, guards, session
│   ├── dashboard/               ← KPIs, gráficas generales
│   ├── portfolios/              ← Lista y detalle de carteras
│   ├── obligations/             ← Formulario completo + tabla
│   ├── courts/                  ← CRUD de juzgados + panel dual
│   ├── reports/                 ← Generador, exportar, compartir
│   ├── catalogs/                ← Gestión de catálogos del tenant
│   └── super-admin/             ← Panel administración global
│
└── shared/
    ├── components/              ← Button, Table, Modal, Badge, Form...
    ├── hooks/                   ← useAuth, useTenant, usePermissions
    ├── api/                     ← Cliente HTTP + hooks TanStack Query
    └── utils/                   ← formatCurrency, formatDate, etc.
```

### 6.3 Paquetes compartidos (Monorepo)

```
packages/
├── shared-types/    ← Tipos TS compartidos entre API y Web
├── shared-schemas/  ← Schemas Zod reutilizados en ambos lados
└── ui/              ← Componentes de UI reutilizables (futuro)
```

---

## 7. Roles y Permisos — Matriz Completa

| Acción | Super Admin | Rep. Legal | Empleado | Visualizador |
|--------|:-----------:|:----------:|:--------:|:------------:|
| Crear / eliminar tenants | ✅ | ❌ | ❌ | ❌ |
| Gestionar suscripciones | ✅ | ❌ | ❌ | ❌ |
| Acceder a cualquier tenant | ✅ | ❌ | ❌ | ❌ |
| Crear / eliminar usuarios del tenant | ❌ | ✅ | ❌ | ❌ |
| Configurar asignación de carteras | ❌ | ✅ | ❌ | ❌ |
| Configurar periodo de reportes | ❌ | ✅ | ❌ | ❌ |
| CRUD Carteras | ❌ | ✅ | ✅† | ❌ |
| CRUD Obligaciones | ❌ | ✅ | ✅† | ❌ |
| CRUD Juzgados | ❌ | ✅ | ✅ | ❌ |
| Registrar recaudos | ❌ | ✅ | ✅ | ❌ |
| Añadir notas (bitácora) | ❌ | ✅ | ✅ | ❌ |
| Gestionar catálogos del tenant | ❌ | ✅ | ❌ | ❌ |
| Generar reportes | ❌ | ✅ | ✅ | ✅ |
| Exportar Excel / PDF | ❌ | ✅ | ✅ | ✅ |
| Crear links compartibles | ❌ | ✅ | ✅ | ✅ |
| Ver report via link público (sin login) | ✅ | ✅ | ✅ | ✅ |

> **†** Acceso a todas las carteras por defecto. El Rep. Legal puede configurar modo de asignación por cartera si lo prefiere.

---

## 8. Sistema de Reportes — Diseño Detallado

### 8.1 Configuración del periodo (por tenant / por cartera)

Cada tenant configura su propio ciclo de reportes. No está hardcodeado a 3 meses.

```
report_configs {
  tenant_id
  portfolio_id       → null = aplica a todo el tenant
  period_type        → MONTHLY | BIMONTHLY | QUARTERLY | CUSTOM
  period_days        → Para CUSTOM (ej: 45 días)
  auto_notify        → true/false
  next_report_date   → Calculado automáticamente
  created_by
}
```

### 8.2 Contenido del reporte

El reporte siempre está **acotado a un rango de fechas** (el período configurado), NO es un volcado histórico total.

```
Reporte generado contiene:
  📋 Encabezado:
     • Logo del tenant (empresa de cobranza)
     • Nombre de la cartera (ej: FOGADE)
     • Período: "Enero 2026 – Marzo 2026"
     • Nombre del abogado responsable
     • Fecha de corte

  📊 Por cada obligación activa en el período:
     • Todos los campos del proceso jurídico (ver tabla sección 2.2)
     • Total recaudado en el período
     • Bitácora del período (solo notas de ese rango de fechas)

  📈 Resumen ejecutivo:
     • Total obligaciones en el período
     • Capital total demandado
     • Total recaudado en el período
     • % de recuperación
     • Distribución por estado

  ⚙️ Personalización (opcional):
     • El usuario puede ocultar columnas que no desea enviar
     • Las preferencias se guardan por tenant/cartera
```

### 8.3 Flujo de compartir

```
Usuario → "Generar Reporte" → Selecciona período + cartera
          ↓
Sistema genera snapshot del reporte (guarda parámetros en BD)
          ↓
Opciones de distribución:
  ┌─────────────────────────────────────────────────────┐
  │ 🔗 Compartir Link                                   │
  │    • Genera token UUID (nanoid)                     │
  │    • URL: tuapp.com/r/{token}                       │
  │    • Configurable: 7 días / 30 días / sin expiración│
  │    • El destinatario NO necesita login              │
  │    • Vista HTML del reporte (modo lectura)          │
  ├─────────────────────────────────────────────────────┤
  │ 📊 Descargar Excel (.xlsx)                          │
  │    • Formato idéntico al Excel de FOGADE 2026       │
  │    • Logo, encabezado, colores corporativos         │
  │    • Todas las columnas del informe jurídico        │
  ├─────────────────────────────────────────────────────┤
  │ 📄 Descargar PDF                                    │
  │    • Layout profesional en orientación horizontal   │
  │    • Mismo contenido que el Excel                   │
  │    • Marca de agua con nombre del tenant            │
  └─────────────────────────────────────────────────────┘
```

---

## 9. Identidad Visual — Diseño Premium de Confianza

### Paleta de Color Propuesta (Psicología del Color para Cobranza)

La paleta se aleja del verde/naranja actual hacia tonos que comunican:
**autoridad legal + precisión + confianza institucional**

| Token | Color | Hex | Uso |
|-------|-------|-----|-----|
| `--primary` | Azul marino profundo | `#0F172A` | Superficie principal |
| `--primary-s` | Azul oscuro | `#1E293B` | Superficies secundarias |
| `--accent` | Azul cobalto | `#2563EB` | Acciones primarias, CTA |
| `--accent-h` | Azul brillante | `#3B82F6` | Hover, estados activos |
| `--gold` | Dorado institucional | `#D4A017` | Destacados premium, KPIs |
| `--success` | Verde esmeralda | `#059669` | Estados positivos |
| `--danger` | Rojo burdeos | `#DC2626` | Alertas críticas |
| `--text` | Gris plata | `#E2E8F0` | Texto principal |
| `--text-2` | Gris medio | `#94A3B8` | Texto secundario |

> **Concepto**: *"Dark Navy Professional"* — La oscuridad transmite seriedad legal. El azul cobalto comunica tecnología de confianza. El dorado da sensación premium institucional. El cliente (cartera) sentirá que está usando un sistema bancario de alto nivel.

---

## 10. Autenticación y Seguridad

### 10.1 Flujo de autenticación

```
1. Usuario ingresa email + contraseña en login.tuapp.com
   (o putumayo.tuapp.com — el subdominio detecta el tenant)
   ↓
2. API valida credenciales, verifica que el tenant esté activo
   (suscripción vigente, no suspendido)
   ↓
3. Genera:
   • Access Token (JWT, 15 min) con: user_id, tenant_id, role
   • Refresh Token (JWT, 30 días) guardado en httpOnly cookie
   ↓
4. Middleware en cada request:
   • Decodifica Access Token
   • Verifica tenant_id del token == tenant_id del subdominio
   • Aplica RBAC según role
   ↓
5. Refresh automático transparente (sin pedir login de nuevo)
```

### 10.2 Seguridad adicional

- Rate limiting en login (máx. 5 intentos / 15 min por IP)
- Passwords hasheados con **bcrypt** (cost factor 12)
- Tokens de reporte con expiración configurable
- CORS restrictivo por subdominio
- Todas las queries con Prisma (protegido contra SQL Injection)

---

## 11. Subdominios — Resolución de Tenant

```
*.tuapp.com → Nginx → API
                        ↓
              Middleware TenantResolver:
              1. Extrae subdominio del Host header
              2. Busca en cache (Redis) si ya está resuelto
              3. Si no, consulta DB: SELECT * FROM tenants WHERE subdomain = ?
              4. Verifica que la suscripción esté activa
              5. Inyecta tenant en el contexto de la request

Ejemplo:
  putumayo.tuapp.com → tenant: "Casa de Cobranzas del Putumayo"
  cobralegal.tuapp.com → tenant: "CobraLegal S.A.S."
  
Super Admin entra por:
  admin.tuapp.com → Panel de administración global
```

---

## 12. Suscripciones (Panel Super Admin)

| Plan | Usuarios máx. | Carteras máx. | Reportes/mes | Precio ref. |
|------|:-------------:|:-------------:|:------------:|:-----------:|
| **STARTER** | 3 | 5 | 20 | Básico |
| **PROFESSIONAL** | 10 | 25 | ilimitados | Estándar |
| **ENTERPRISE** | ilimitados | ilimitados | ilimitados | Premium |

El Super Admin puede:
- Crear, editar y suspender tenants
- Cambiar de plan manualmente
- Ver fecha de vencimiento de cada suscripción
- Activar/desactivar tenants

---

## 13. Convenciones de Código (Código Limpio, Mantenible y Escalable)

### Principios SOLID aplicados al sistema

```
S → Single Responsibility: Cada use-case hace UNA cosa.
    CreateObligationUseCase solo crea obligaciones.
    GenerateReportUseCase solo genera reportes.

O → Open/Closed: Nuevos formatos de reporte (ej: CSV) se agregan
    implementando la interfaz IExporter, sin tocar código existente.

L → Liskov: PrismaPortfolioRepository puede sustituirse por
    MockPortfolioRepository en tests sin cambiar los use-cases.

I → Interface Segregation: IReportRepository no tiene métodos
    que no usa. No hay interfaces "gordas".

D → Dependency Inversion: Los use-cases dependen de interfaces,
    no de Prisma directamente. Prisma es un detalle de infraestructura.
```

### Convenciones de nombrado

| Scope | Convención | Ejemplo |
|-------|-----------|---------|
| Archivos | kebab-case | `create-obligation.use-case.ts` |
| Clases | PascalCase | `CreateObligationUseCase` |
| Funciones/vars | camelCase | `registerRecovery()` |
| Constantes | SCREAMING_SNAKE | `MAX_RETRY_ATTEMPTS` |
| Tablas DB | snake_case plural | `obligation_statuses` |
| Columnas DB | snake_case | `tenant_id`, `capital_balance` |
| Rutas API | kebab-case | `GET /api/obligations/:id` |
| **Código** | **Inglés** | Siempre |
| **UI / mensajes** | **Español** | Siempre |

### Estructura de respuesta API unificada

```typescript
// Éxito
{ success: true, data: {...}, meta: { page, total, limit } }

// Error
{ success: false, error: { code: "OBLIGATION_NOT_FOUND", message: "..." } }
```

---

## 14. Hoja de Ruta — 5 Fases

### Fase 1 — Fundamentos del SaaS *(Base)*
- [ ] Setup Monorepo Turborepo (`api` + `web` + `shared`)
- [ ] Schema Prisma: todas las entidades normalizadas
- [ ] Seed de datos iniciales (catálogos, tenant demo)
- [ ] Autenticación JWT completa (login, refresh, logout)
- [ ] Middleware: RBAC + Tenant Resolver (subdominio)
- [ ] Frontend: Login screen con diseño Dark Navy Premium
- [ ] Routing con guards por rol

### Fase 2 — Core de Negocio *(Carteras y Obligaciones)*
- [ ] CRUD completo de Carteras (Portfolios)
- [ ] CRUD completo de Obligaciones (6 secciones del formulario)
- [ ] CRUD de Juzgados (+ panel dual de procesos)
- [ ] Deudores, codeudores, contactos dinámicos (relaciones normalizadas)
- [ ] Catálogos del tenant: estados, medidas, niveles, municipios
- [ ] Bitácora y recaudos
- [ ] Filtros y búsqueda (nombre, cédula, radicado)
- [ ] Asignación de carteras a empleados (configurable)

### Fase 3 — Dashboard y Reportes *(El diferenciador)*
- [ ] Dashboard con KPIs reales: capital total, recaudo, % recuperación
- [ ] Gráfica donut de estados, barra cartera vs recaudo
- [ ] Módulo de Reportes: generador por período + cartera
- [ ] Configuración del período (mensual, trimestral, personalizado)
- [ ] Exportación **Excel** con formato idéntico al informe FOGADE real
- [ ] Exportación **PDF** con diseño corporativo premium
- [ ] **Links compartibles** con token temporal y página pública

### Fase 4 — Super Admin y Suscripciones *(La capa comercial)*
- [ ] Panel Super Admin en `admin.tuapp.com`
- [ ] CRUD de Tenants con configuración de subdominio
- [ ] Gestión de suscripciones y planes (STARTER / PROFESSIONAL / ENTERPRISE)
- [ ] Dashboard global: métricas de todos los tenants
- [ ] Activar / suspender tenants

### Fase 5 — Producción y Calidad *(El lanzamiento)*
- [ ] Dockerización completa (API + Web + DB + Redis + Nginx)
- [ ] Deploy en Railway con subdominios wildcard
- [ ] Variables de entorno por ambiente (dev / staging / prod)
- [ ] Tests unitarios de use-cases críticos (Jest)
- [ ] Tests de integración de rutas clave (supertest)
- [ ] Documentación de API (OpenAPI 3.0 generado automáticamente con Fastify)
- [ ] Auditoría de seguridad: rate limiting, CORS, headers de seguridad

---

## Decisiones Tomadas (Confirmadas)

| Pregunta | Decisión |
|----------|---------|
| Multi-tenant | Shared schema + `tenant_id` en todas las tablas |
| Acceso | Subdominio por tenant (`cliente.tuapp.com`) |
| Modelo de datos | Tenant → Cartera → Obligación (3 niveles) |
| Empleados | Acceso a todas las carteras por defecto; asignación opcional |
| Diseño | Paleta "Dark Navy Professional" (azul marino + cobalto + dorado) |
| Autenticación | Solo email + contraseña (por ahora) |
| Catálogos | Entidades normalizadas con FK, no enums ni text libre |
| Juzgados | CRUD completo como entidad de primer nivel |
| Reportes | Configurables por período (no hardcodeado a 3 meses) |
| Formato Excel | Replicar formato exacto del `informe JURIDICO - FOGADE 2026` |
| Compartir | Link temporal + Excel + PDF |

---

## Preguntas Pendientes (Menores)

> [!NOTE]
> Las siguientes preguntas no bloquean el inicio pero necesito tu confirmación antes de la fase correspondiente:

1. **Nombre del SaaS**: ¿Ya tienes nombre para la plataforma (ej: `CobraSync`, `LexCobra`, etc.) o lo definimos después?

2. **Dominio**: ¿Ya tienes o tienes en mente el dominio principal? (`tuapp.com` es un placeholder)

3. **Logo del sistema**: ¿El sistema tendrá su propio logo (diferente al de Casa de Cobranzas del Putumayo)?

4. **Límite de usuarios del tenant demo**: Al desplegar, ¿cuántos usuarios necesita activos el primer tenant (Casa de Cobranzas del Putumayo)?

5. **Municipios**: ¿Solo municipios del Putumayo en el catálogo inicial, o todos los municipios de Colombia?

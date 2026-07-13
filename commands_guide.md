# 🚀 Guía de Comandos — LexCobra

Esta guía centraliza todos los comandos necesarios para operar el proyecto en tu día a día. Dado que usamos **pnpm** y **Turborepo** (`turbo`), todos estos comandos están pensados para ser ejecutados siempre desde la **raíz del proyecto** (`lexcobra/`).

---

## 💻 1. Inicio y Desarrollo (Día a Día)

Estos son los comandos que usarás todo el tiempo para programar.

### `pnpm dev`
> [!TIP]
> **El comando principal.** Levanta todo el entorno en modo desarrollo con "Hot Reload" (los cambios se ven en vivo al guardar el código).

- **Qué hace:** Orquesta el arranque simultáneo de la API en `apps/api` (usando `tsx watch`) y la Web en `apps/web` (usando `vite`).
- **Cuándo usarlo:** Cada vez que te sientes a programar.

### `pnpm docker:up`
- **Qué hace:** Levanta los contenedores de Docker (PostgreSQL y Redis) en segundo plano (modo detached).
- **Cuándo usarlo:** Antes de iniciar `pnpm dev` si has reiniciado tu computadora o has apagado Docker.

### `pnpm docker:down`
- **Qué hace:** Apaga y destruye temporalmente los contenedores de Docker (los datos **no** se pierden, se quedan en los volúmenes).
- **Cuándo usarlo:** Cuando terminas de trabajar y quieres liberar memoria en tu PC.

### `pnpm docker:logs`
- **Qué hace:** Te muestra en tiempo real los logs (registros) del motor de la base de datos PostgreSQL.
- **Cuándo usarlo:** Si la API te arroja errores extraños de conexión o si quieres monitorear qué está haciendo la BD.

---

## 🗄️ 2. Base de Datos (Prisma)

Estos comandos interactúan con la base de datos a través de Prisma ORM.

### `pnpm db:studio`
> [!NOTE]
> Muy útil para verificar datos visualmente sin tener que entrar al frontend.

- **Qué hace:** Levanta una interfaz gráfica local (en tu navegador) para ver, editar y borrar registros directamente de la base de datos.
- **Cuándo usarlo:** Cuando quieres ver qué datos hay guardados realmente (ej. verificar si un usuario o un inquilino se creó correctamente).

### `pnpm db:generate`
- **Qué hace:** Lee tu archivo `schema.prisma` y genera el cliente TypeScript (`@prisma/client`) para que tu código reconozca los nuevos modelos y columnas.
- **Cuándo usarlo:** Obligatoriamente cada vez que modifiques el archivo `apps/api/prisma/schema.prisma`.

### `pnpm db:migrate`
- **Qué hace:** Compara tu `schema.prisma` con el estado actual de la base de datos, genera un archivo SQL con los cambios (migración) y lo aplica a PostgreSQL.
- **Cuándo usarlo:** Después de añadir/modificar modelos en el `schema.prisma` y querer que la base de datos refleje esos cambios.

### `pnpm db:seed`
> [!WARNING]
> Ten cuidado, usualmente los scripts de seed limpian y re-crean los datos maestros, lo que podría borrar datos de prueba si no está programado para ignorarlos.

- **Qué hace:** Ejecuta el archivo `seed.ts` para poblar la base de datos con información por defecto (Usuarios Admin, Roles iniciales, Catálogos base, etc.).
- **Cuándo usarlo:** Cuando levantas el entorno desde cero en una computadora nueva o si borraste la base de datos.

---

## 📦 3. Compilación y Calidad (Producción)

Estos comandos preparan el código para ser subido a un servidor real.

### `pnpm build`
- **Qué hace:** Ejecuta el proceso de compilación estricto en todo el monorepo. Verifica tipos, compila la API a JavaScript puro (`dist/`) y empaqueta la aplicación web (React) dejándola lista y minificada.
- **Cuándo usarlo:** Antes de un pase a producción, o para verificar que todo el código esté libre de errores (TypeScript es estricto en este paso).

### `pnpm type-check`
- **Qué hace:** Analiza todo el código de todos los paquetes y aplicaciones buscando errores de tipos de TypeScript, pero **sin** generar los archivos compilados finales.
- **Cuándo usarlo:** Cuando quieres asegurarte de que tu código está bien tipeado sin esperar el tiempo que demora un build completo.

### `pnpm lint`
- **Qué hace:** Pasa la herramienta ESLint por todo el código para detectar malas prácticas, variables sin usar o estilos de código que no cumplen el estándar del equipo.
- **Cuándo usarlo:** Recomendado antes de hacer un commit (guardar cambios en Git).

---

## 🛠️ 4. Gestión de Dependencias (Instalación de paquetes)

Ya que usamos `pnpm` con Workspaces, la forma de instalar dependencias varía ligeramente.

### Instalar una librería para un proyecto específico
> [!IMPORTANT]
> A diferencia de proyectos normales donde usas `npm install paquete`, aquí debes indicar a **qué aplicación** le vas a instalar el paquete usando `--filter`.

**Ejemplo: Instalar `axios` solo en el frontend (Web):**
```bash
pnpm --filter @lexcobra/web add axios
```

**Ejemplo: Instalar `moment` solo en el backend (API):**
```bash
pnpm --filter @lexcobra/api add moment
```

### Instalar las dependencias de todo el proyecto
```bash
pnpm install
```
- **Qué hace:** Lee todos los `package.json` (raíz, api, web y shared) e instala todas las librerías respetando la caché.
- **Cuándo usarlo:** Cuando clonas el proyecto por primera vez, o cuando haces `git pull` y otro desarrollador agregó nuevas librerías.



---

## 🗄️ 5. Limpieza, Inicialización y Semillado de la Base de Datos

Cuando necesites limpiar toda la base de datos y dejarla lista para producción (o desarrollo limpio) únicamente con los datos del administrador y catálogos obligatorios, puedes hacerlo de dos formas.

> [!IMPORTANT]
> **Recomendado:** Ejecuta siempre los comandos desde la **raíz del proyecto** para mantener la consistencia y no tener que cambiar de directorios.

### Método A: Desde la raíz del proyecto (Recomendado 🚀)

#### 1. Limpiar la base de datos por completo (Borra todos los registros y restablece el esquema vacío)
```bash
pnpm --filter @lexcobra/api prisma migrate reset --force
```

#### 2. Definir variable de entorno para omitir datos de prueba (Demo Data) y poblar sólo con Administradores y Catálogos
Dependiendo de la terminal que estés usando en tu editor de código o sistema, ejecuta:

* **En PowerShell (Windows):**
  ```powershell
  $env:SKIP_DEMO_DATA="true"
  pnpm db:seed
  ```

* **En Command Prompt (CMD - Windows):**
  ```cmd
  set SKIP_DEMO_DATA=true
  pnpm db:seed
  ```

* **En Git Bash / Linux / macOS:**
  ```bash
  SKIP_DEMO_DATA=true pnpm db:seed
  ```

#### 3. Sincronizar y generar los tipos actualizados de Prisma
```bash
pnpm db:generate
```

---

### Método B: Accediendo a la subcarpeta de la API

Si prefieres trabajar directamente dentro del subproyecto de la API:

```bash
# 1. Ir a la carpeta de la API
cd apps/api

# 2. Resetear base de datos
npx prisma migrate reset --force

# 3. Establecer la variable de entorno (Ejemplo en PowerShell)
$env:SKIP_DEMO_DATA="true"

# 4. Ejecutar el archivo semilla limpio
pnpm run db:seed

# 5. Sincronizar el esquema con la base de datos
npx prisma db push
```

---

## ⚠️ 6. Solución de Problemas Comunes

### Error: `EPERM: operation not permitted` al ejecutar `prisma generate`
* **Por qué sucede:** En Windows, el servidor de desarrollo (`pnpm dev`) mantiene abierto el archivo binario del motor de consultas (`query_engine-windows.dll.node`) y lo bloquea, impidiendo que Prisma lo actualice.
* **Cómo solucionarlo:**
  1. Detén el servidor de desarrollo en tu consola presionando `Ctrl + C`.
  2. Ejecuta el comando de generación:
     ```bash
     pnpm db:generate
     ```
  3. Vuelve a iniciar tu servidor de desarrollo con:
     ```bash
     pnpm dev
     ```
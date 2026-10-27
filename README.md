# CoSpace

CoSpace es una aplicación fullstack para consultar y reservar espacios de coworking por hora. Los usuarios pueden registrarse, iniciar sesión, explorar el catálogo y administrar sus reservas. El rol administrador permite gestionar los espacios.

La aplicación utiliza Next.js 16 con App Router, React, TypeScript, Prisma y PostgreSQL en Supabase. Los datos de la aplicación se consultan desde la base de datos propia mediante Route Handlers o consultas del servidor.

## Requisitos

- Node.js 20.9 o posterior. Se recomienda Node.js 22 LTS.
- npm (incluido con Node.js).
- Una base PostgreSQL en Supabase.
- Git para clonar el repositorio.
- Docker, solo si se desea ejecutar el contenedor.

## Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/) y guarda la contraseña de la base de datos.
2. En el panel del proyecto, abre **Connect** y copia una URI de PostgreSQL.
3. Usa la conexión **Session pooler** para `DATABASE_URL` si la red donde corre la aplicación necesita conexión agrupada.
4. Usa la conexión **Direct connection** para `DIRECT_URL`, que Prisma utiliza al aplicar migraciones y al ejecutar el seed.
5. Si la contraseña contiene caracteres especiales, codifícala para usarla en una URI.

La conexión debe incluir SSL (`sslmode=require`). Si solo tienes una URI, puedes usarla en ambas variables; para migraciones en Supabase se recomienda la conexión directa.

## Variables de entorno

Crea el archivo local `.env` a partir de `.env.example`. Completa los valores en tu equipo y no subas `.env` ni secretos al repositorio.

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión PostgreSQL usada por la aplicación en tiempo de ejecución. |
| `DIRECT_URL` | Recomendada | Conexión directa para migraciones y seed. Si se omite, se usa `DATABASE_URL`. |
| `JWT_ACCESS_SECRET` | Sí | Firma del access token. Genera un secreto aleatorio con `openssl rand -base64 32`. |
| `JWT_REFRESH_SECRET` | Sí | Firma del refresh token. Genera otro secreto distinto con `openssl rand -base64 32`. |

Para generar los secretos en Linux o macOS:

```bash
openssl rand -base64 32
openssl rand -base64 32
```

Pega cada resultado en la variable correspondiente de `.env`. No uses las cadenas de ejemplo ni publiques los valores reales.

## Instalación y ejecución en desarrollo

Desde una terminal:

```bash
# 1. Clonar el repositorio y entrar en el proyecto
git clone <URL_DEL_REPOSITORIO>
cd cospace-corregido-auth-fix-v2

# 2. Instalar las dependencias
npm ci

# 3. Crear la configuración local
cp .env.example .env
# Edita .env y completa las conexiones y secretos descritos arriba.

# 4. Generar el cliente de Prisma
npx prisma generate

# 5. Aplicar las migraciones pendientes a la base configurada
npx prisma migrate deploy

# 6. Crear el administrador y los datos de demostración
npm run db:seed

# 7. Iniciar Next.js en modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Si estás en PowerShell y `cp` no está disponible, crea el archivo con:

```powershell
Copy-Item .env.example .env
```

### Credenciales iniciales del seed

- **Administrador:** `admin@cospace.com`
- **Contraseña:** `Admin123*`
- **Usuario de demostración:** `user@cospace.com`
- **Contraseña:** `User123*`

El seed crea los usuarios si no existen y agrega los espacios de demostración si no están registrados. Si la cuenta de administrador ya existía, el seed no cambia su contraseña. En un entorno publicado, reemplaza las credenciales de demostración por credenciales seguras.

## Ejecución de producción

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

La aplicación necesita `DATABASE_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` también en el entorno de producción.

## Ejecución con Docker

El repositorio incluye un `Dockerfile`. Las migraciones y el seed se ejecutan desde el host para controlar explícitamente la base de datos:

```bash
# Configura .env antes de empezar.
npx prisma migrate deploy
npm run db:seed

# Construye la imagen y ejecuta el contenedor
docker build -t cospace:local .
docker run --name cospace --env-file .env -p 3000:3000 cospace:local
```

Abre [http://localhost:3000](http://localhost:3000). Para detener el contenedor, pulsa `Ctrl+C`; para iniciarlo de nuevo usa `docker start -a cospace`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Next.js en modo desarrollo. |
| `npm run build` | Genera la compilación de producción. |
| `npm run start` | Inicia la compilación de producción. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| `npm run db:seed` | Ejecuta `prisma/seed.ts` para crear los usuarios y espacios de demostración. |

Para aplicar migraciones nuevas en una base ya existente, ejecuta `npx prisma migrate deploy`. Para crear una migración durante el desarrollo del esquema, usa `npx prisma migrate dev --name nombre_de_la_migracion`.

## Rutas principales

| URL | Descripción | Acceso |
| --- | --- | --- |
| `/` | Inicio. | Público |
| `/spaces` | Catálogo de espacios activos. | Público |
| `/spaces/[id]` | Detalle y formulario de reserva. | Público; reservar requiere sesión |
| `/register` | Registro de cuenta de usuario. | Público |
| `/login` | Inicio de sesión. | Público |
| `/dashboard` | Lista y cancelación de reservas propias. | Usuario autenticado |
| `/admin` | Administración de espacios. | Administrador |

Las APIs se encuentran en `src/app/api`: autenticación, catálogo y administración de espacios, y operaciones de reservas. El proxy protege las rutas de dashboard y administración; cada Route Handler también valida su autenticación y permisos.

## Reglas implementadas

- Las reservas deben ser de 1 a 4 horas completas y estar dentro del horario de 7:00 a 21:00, hora de Colombia.
- No se permiten reservas pasadas ni con más de 30 días de anticipación.
- No se permiten solapamientos para el espacio ni para el usuario, y cada usuario puede tener hasta 3 reservas futuras confirmadas.
- El servidor valida que el espacio esté activo y calcula el total a partir de la duración y la tarifa del espacio.
- Solo el titular de la reserva o un administrador puede cancelarla. El usuario debe cancelarla con al menos 2 horas de anticipación.
- Los espacios se desactivan en lugar de eliminarse y no pueden desactivarse si tienen reservas futuras confirmadas.

## Imágenes e idioma

El panel de administración permite añadir una imagen a un espacio mediante una URL o la carga de un archivo. Los archivos se reducen en el navegador y se guardan en el campo `Space.imageUrl` de PostgreSQL. Next.js los muestra con `next/image`.

El selector de la barra de navegación cambia entre español e inglés. La selección se guarda en el navegador.

## Estructura del proyecto

```text
src/
  app/                 Páginas, layouts, grupos de rutas y Route Handlers
  features/            Funcionalidades de auth, reservas y espacios
  i18n/                Contexto y diccionarios español/inglés
  lib/                 Cliente Prisma
  shared/              Componentes y utilidades compartidas
  proxy.ts             Protección inicial de rutas privadas
prisma/
  migrations/          Migraciones SQL
  schema.prisma        Modelo relacional
  seed.ts              Administrador, usuario y espacios de demostración
```

## Despliegue

La base de datos del proyecto está configurada para Supabase. La URL pública de producción en Vercel debe agregarse aquí después de completar y verificar el despliegue:

```text
Pendiente de despliegue: <URL_DE_VERCEL>
```

En Vercel configura `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` en las variables del proyecto. Después de desplegar, verifica login, refresh, reservas, imágenes y acceso de administrador usando el dominio de producción.

## Limitaciones conocidas

- El endpoint `POST /api/auth/refresh` está implementado, pero el cliente todavía no renueva automáticamente la sesión cuando vence el access token.
- No se incluye un script de pruebas automatizadas.
- La URL de producción de Vercel debe completarse cuando exista un despliegue verificado.

# Expediente — Frontend

React + Vite. Interfaz del sistema de seguimiento de trámites, permisos y vencimientos
(el backend está en el repo `expediente-backend`).

## Desarrollo local

```bash
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

Sin `VITE_API_URL`, apunta a `http://localhost:8000`.

## Producción (Vercel u otro hosting estático)

Build: `npm run build` (carpeta `dist`). Define la variable de entorno `VITE_API_URL` con la URL
pública de tu backend y vuelve a desplegar.

## Personalización

El nombre, eslogan, color principal, logo y tiempo de inactividad se configuran **en el backend**
(`APP_NAME`, `APP_TAGLINE`, `APP_PRIMARY_COLOR`, `APP_LOGO_URL`, `INACTIVIDAD_MINUTOS`); el frontend
los lee de `GET /config`. Las categorías, tipos de trámite y etapas se administran desde la
pantalla **Catálogo**, y el nombre de tu empresa viene de la organización creada con `python -m app.seed`.

## Estructura

- `src/api.js` — toda la comunicación con el backend
- `src/context/` — usuario autenticado y configuración de la instalación
- `src/pages/` — Dashboard, Empresas, detalle de empresa, Usuarios, Catálogo, Importar
- `src/components/` — modales y secciones (trámites, observaciones, documentos)

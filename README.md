# Bobina Visor V2

Aplicación React + Vite que permite explorar inventario histórico de bobinas a partir de archivos CSV. Incluye visualizaciones (Recharts), lectura y filtrado con Danfo.js, y estilos con Tailwind.

## Requisitos

- Node.js 20+
- npm

## Instalación y desarrollo

```bash
npm install
npm run dev
```

## Linting

```bash
npm run lint
```

## Construcción local

```bash
npm run build
npm run preview
```

## Modo PWA

La aplicación está configurada como **Progressive Web App (PWA)** mediante `vite-plugin-pwa` (`v1.0.3`):

- Se genera un `service worker` con actualizaciones automáticas y caché offline para los recursos estáticos.
- Se incluyen manifest y `app icons` (`public/icons/*`) para instalación en dispositivos móviles y escritorio.
- El upgrade a `v1.0.3` elimina los avisos de build con Rolldown/Vite y corrige advertencias de `scope_extensions`, manteniendo la compatibilidad con el `base` personalizado.
- Se añaden `robots.txt`, `manifest.id` y más activos estáticos (`vite.svg`, `apple-touch-icon`) al precache para cumplir los requisitos mínimos de PWA.
- En desarrollo el plugin levanta un service worker temporal en `dev-dist/`; si aparece un error `ENOENT … dev-dist/sw.js`, asegúrate de reiniciar `npm run dev` tras la instalación de dependencias (la configuración actual ya suprime los avisos de Workbox para evitarlo).

### Pruebas locales

1. Ejecuta `npm run build` para generar la build de producción.
2. Arranca el servidor local con `npm run preview` y abre la URL que se muestre en consola.
3. Usa las herramientas de desarrollo del navegador (pestaña **Application → Manifest**) para instalar la PWA o simular condiciones offline.

En modo desarrollo (`npm run dev`) el `service worker` también se activa para facilitar las pruebas gracias a la opción `devOptions.enabled`.

## Despliegue en GitHub Pages

Este repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que construye la aplicación y la publica en GitHub Pages.

1. Habilita **GitHub Pages** en la pestaña _Settings → Pages_ del repositorio y selecciona la opción **GitHub Actions** como fuente.
2. Asegúrate de que la rama principal sea `main` o ajusta la lista `branches` en el workflow si utilizas otro nombre.
3. Haz push a `main` o ejecuta el workflow manualmente desde la pestaña _Actions_.

El workflow configura la variable `BASE_PATH` automáticamente para que la build de Vite utilice el subdirectorio correcto (`/<nombre-del-repo>/`). Al finalizar, el deployment `github-pages` se actualizará con la URL pública (`https://<usuario>.github.io/<nombre-del-repo>/`).

Si necesitas un dominio personalizado, configura un archivo `CNAME` dentro de la carpeta `public/` y actualiza la configuración de Pages según corresponda.

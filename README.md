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

## Despliegue en GitHub Pages

Este repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que construye la aplicación y la publica en GitHub Pages.

1. Habilita **GitHub Pages** en la pestaña _Settings → Pages_ del repositorio y selecciona la opción **GitHub Actions** como fuente.
2. Asegúrate de que la rama principal sea `main` o ajusta la lista `branches` en el workflow si utilizas otro nombre.
3. Haz push a `main` o ejecuta el workflow manualmente desde la pestaña _Actions_.

El workflow configura la variable `BASE_PATH` automáticamente para que la build de Vite utilice el subdirectorio correcto (`/<nombre-del-repo>/`). Al finalizar, el deployment `github-pages` se actualizará con la URL pública (`https://<usuario>.github.io/<nombre-del-repo>/`).

Si necesitas un dominio personalizado, configura un archivo `CNAME` dentro de la carpeta `public/` y actualiza la configuración de Pages según corresponda.

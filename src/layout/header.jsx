import { useCallback, useMemo, useRef } from "react";
import { listCSVFiles } from "@/utils/csvRead.js";

const DIRECTORY_INPUT_ID = "directory-picker";

function shortenPath(value, maxLength = 40) {
  if (!value || value.length <= maxLength) {
    return value ?? "";
  }

  const prefixLength = Math.ceil((maxLength - 1) * 0.6);
  const suffixLength = maxLength - prefixLength - 1;
  const start = value.slice(0, prefixLength).trimEnd();
  const end = value.slice(-suffixLength).trimStart();

  return `${start}…${end}`;
}

/**
 * Permite seleccionar la carpeta donde se leeran los archivos CSV (.CSV o .csv), y muestra el nombre de la aplicacion.
 * almacena la ruta en el estado del componente padre.
 * @module Header
 */
export default function Header({ filePath, setFilePath, onCSVFilesSelected }) {
  const directoryInputRef = useRef(null);

  const normalizedPath = useMemo(() => filePath?.trim() ?? "", [filePath]);
  const truncatedPath = useMemo(
    () => (normalizedPath ? shortenPath(normalizedPath) : ""),
    [normalizedPath]
  );

  const handleDirectorySelection = useCallback(
    (event) => {
      const { files } = event.target;

      if (!files || files.length === 0) {
        setFilePath("");
        onCSVFilesSelected?.([]);
        return;
      }

      const csvFiles = listCSVFiles(files);
      onCSVFilesSelected?.(csvFiles);

      const fallbackEntry = files[0];
      const [primaryEntry] = csvFiles.length
        ? csvFiles
        : [
            {
              relativePath: fallbackEntry?.webkitRelativePath?.length
                ? fallbackEntry.webkitRelativePath
                : fallbackEntry?.name ?? "",
            },
          ];

      const relativePath = primaryEntry?.relativePath ?? "";
      const rootDirectory = relativePath.includes("/")
        ? relativePath.split("/")[0]
        : relativePath;

      setFilePath(rootDirectory);

      if (event.target?.value) {
        event.target.value = "";
      }
    },
    [onCSVFilesSelected, setFilePath]
  );

  const handleTriggerSelection = useCallback(() => {
    directoryInputRef.current?.click();
  }, []);

  const handleClearSelection = useCallback(() => {
    setFilePath("");
    onCSVFilesSelected?.([]);

    if (directoryInputRef.current) {
      directoryInputRef.current.value = "";
    }
  }, [onCSVFilesSelected, setFilePath]);

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 text-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
            Bobina Visor
          </p>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Bobina Visor <span className="text-indigo-300">V2</span>
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Selecciona la carpeta con archivos CSV para analizar el inventario y
            el histórico de producción.
          </p>
        </div>
        <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-xs text-slate-300 sm:text-sm">
            <span className="font-medium uppercase tracking-wide text-slate-400">
              Directorio seleccionado
            </span>
            <p
              className={`mt-1 truncate text-base font-semibold ${
                normalizedPath ? "text-white" : "text-slate-500"
              }`}
              title={normalizedPath || "Sin carpeta seleccionada"}
            >
              {normalizedPath ? truncatedPath : "Sin carpeta seleccionada"}
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={handleTriggerSelection}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              aria-controls={DIRECTORY_INPUT_ID}
            >
              Seleccionar carpeta
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={!normalizedPath}
              className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
            >
              Limpiar selección
            </button>
          </div>
          <input
            id={DIRECTORY_INPUT_ID}
            ref={directoryInputRef}
            type="file"
            className="sr-only"
            onChange={handleDirectorySelection}
            multiple
            webkitdirectory="true"
            directory="true"
          />
        </div>
      </div>
    </header>
  );
}

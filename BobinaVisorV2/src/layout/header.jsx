import { listCSVFiles } from "@/utils/csvRead.js";

/**
 * Permite seleccionar la carpeta donde se leeran los archivos CSV (.CSV o .csv), y muestra el nombre de la aplicacion.
 * almacena la ruta en el estado del componente padre.
 * @module Header
 */
export default function Header({ filePath, setFilePath, onCSVFilesSelected }) {
  const handleDirectorySelection = (event) => {
    const { files } = event.target;

    if (!files || files.length === 0) {
      setFilePath("");
      onCSVFilesSelected?.([]);
      return;
    }

    const csvFiles = listCSVFiles(files);
    onCSVFilesSelected?.(csvFiles);
    const [primaryEntry] = csvFiles.length
      ? csvFiles
      : [
          {
            relativePath:
              files[0].webkitRelativePath?.length > 0
                ? files[0].webkitRelativePath
                : files[0].name,
          },
        ];

    const rootDirectory = primaryEntry.relativePath.includes("/")
      ? primaryEntry.relativePath.split("/")[0]
      : primaryEntry.relativePath;

    setFilePath(rootDirectory);
  };

  return (
    <header className="w-full h-16 bg-gray-800 text-white flex items-center justify-center">
      <h1 className="text-2xl font-bold">Bobina Visor V2 </h1>
      <br />
      <p> path: {filePath}</p>
      <input
        type="file"
        webkitdirectory="true"
        directory="true"
        className="ml-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-violet-50 file:text-violet-700
                          hover:file:bg-violet-100"
        onChange={handleDirectorySelection}
      />
    </header>
  );
}

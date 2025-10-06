import { useEffect, useState } from "react";
import Header from "@/layout/header.jsx";
import Footer from "@/layout/footer.jsx";
import Inventario from "@/components/inventario.jsx";
import Historico from "@/components/historico.jsx";
function App() {
  const [filePath, setFilePath] = useState("");
  const [csvFiles, setCsvFiles] = useState([]);
  const [lastFile, setLastFile] = useState(null);
  const [maxFiles, setMaxFiles] = useState(5);
  /**
   * Funcion para buscar el file mas reciente de filePath
   * formato de cada archivo: "20250913-110416.CSV" -> YYYYMMDD-HHMMSS.CSV
   */
  const findMostRecentCSV = (entries) => {
    if (!entries || entries.length === 0) {
      return null;
    }

    const latestEntry = entries.reduce((latest, entry) => {
      const name = entry?.file?.name ?? entry?.relativePath ?? "";
      const match = name.match(
        /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.csv$/i
      );

      if (!match) {
        return latest;
      }

      const [, year, month, day, hour, minute, second] = match;
      const timestamp = Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );

      if (Number.isNaN(timestamp)) {
        return latest;
      }

      if (!latest || timestamp > latest.timestamp) {
        return {
          entry,
          timestamp,
        };
      }

      return latest;
    }, null);

    if (!latestEntry) {
      return null;
    }

    return {
      ...latestEntry.entry,
      timestamp: new Date(latestEntry.timestamp),
    };
  };

  useEffect(() => {
    const latest = findMostRecentCSV(csvFiles);
    setLastFile(latest);
  }, [csvFiles]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        filePath={filePath}
        setFilePath={setFilePath}
        onCSVFilesSelected={setCsvFiles}
      />
      <main className="flex-grow p-4">
        {lastFile ? (
          <p className="mt-2 text-sm text-green-600">
            Último archivo cargado: {lastFile.relativePath}
          </p>
        ) : (
          <p className="mt-2 text-sm text-yellow-600">
            No se encontró un archivo CSV válido aún.
          </p>
        )}
        <Inventario file={lastFile?.file ?? null} />
        <Historico
          files={csvFiles}
          maxDays={maxFiles}
          onChangeMaxDays={setMaxFiles}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;

// usa danfojs to read a csv file and return a dataframe
import * as dfd from "danfojs";

export const normalizeString = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

export function dataFrameToRows(dataFrame) {
  if (!dataFrame) {
    return [];
  }

  const columns = Array.isArray(dataFrame.columns) ? dataFrame.columns : [];
  const source = dataFrame?.values ?? [];
  const rawValues = Array.isArray(source)
    ? source
    : typeof source.toArray === "function"
    ? source.toArray()
    : Array.from(source);

  return rawValues.map((row) => {
    if (
      row &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      row.constructor === Object
    ) {
      return row;
    }

    const rowArray = Array.isArray(row) ? row : Array.from(row ?? []);
    const rowObject = {};

    columns.forEach((column, index) => {
      rowObject[column] = rowArray[index] ?? null;
    });

    return rowObject;
  });
}

function matchesGeneralCriteria(row) {
  const location = normalizeString(row?.LOCATION);
  const estado = normalizeString(row?.ESTADO);
  const depo = normalizeString(row?.DEPO);

  return (
    location !== "ULOG" &&
    location !== "DPBQ" &&
    estado === "STOCK" &&
    depo === "PLANTA SFM"
  );
}

export function filterRowsByCriteria(rows) {
  return rows.filter(matchesGeneralCriteria);
}

/**
 * Filtros generales para archivos CSV
 * filtra por elementos:
 *      row["LOCATION"] !== "ULOG" &&
        row["LOCATION"] !== "DPBQ" &&
        row["ESTADO"] === "STOCK" &&
        row["DEPO"] === "Planta SFM"
    Solo conservar las columnas:
    ROLL_ID: row["ROLL_ID"],
    PAPER_CODE: row["PAPER_CODE"],
    WIDTH: row["WIDTH"],
    ESTADO: row["ESTADO"],
    COMPLETA: row["COMPLETA"],
 * @module csvUtils
 */
function filter(df) {
  const requiredColumns = [
    "ROLL_ID",
    "PAPER_CODE",
    "WIDTH",
    "ESTADO",
    "COMPLETA",
    "LOCATION",
    "DEPO",
  ];

  const hasColumns = requiredColumns.every((column) =>
    df.columns.includes(column)
  );

  if (!hasColumns) {
    console.warn("El archivo CSV no contiene todas las columnas requeridas.");
  }
  const filteredRows = filterRowsByCriteria(dataFrameToRows(df)).filter(
    (row) => normalizeString(row?.COMPLETA) === "SALDO"
  );
  const outputColumns = [
    "ROLL_ID",
    "PAPER_CODE",
    "WIDTH",
    "ESTADO",
    "COMPLETA",
  ];

  const data = filteredRows.map((row) =>
    outputColumns.map((column) => row?.[column] ?? null)
  );

  return new dfd.DataFrame(data, { columns: outputColumns });
}

/**
 *  Lee un archivo CSV y devuelve un DataFrame de danfojs.
 *  @param {File} file - Archivo CSV seleccionado desde el navegador.
 *  @returns {Promise<dfd.DataFrame>} - Un DataFrame que contiene los datos del CSV.
 */
export async function readCSV(file, options = {}) {
  let objectUrl;
  try {
    if (!(file instanceof File)) {
      throw new Error("Se esperaba un archivo CSV válido.");
    }

    objectUrl = URL.createObjectURL(file);

    const df = await dfd.readCSV(objectUrl);

    const { applyFilter = true } = options;

    return applyFilter ? filter(df) : df;
  } catch (error) {
    console.error("Error reading CSV file:", error);
    throw error;
  } finally {
    if (typeof URL !== "undefined" && objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

/**
 * Lista los archivos CSV dentro de un conjunto de archivos seleccionados.
 * @param {FileList | File[]} files - Lista de archivos retornada por un input con directorios.
 * @returns {Array<{ file: File, relativePath: string }>} - Archivos CSV encontrados y sus rutas relativas.
 */
export function listCSVFiles(files) {
  if (!files) {
    return [];
  }

  const items = Array.from(files);

  return items
    .filter((file) => file?.name && file.name.toLowerCase().endsWith(".csv"))
    .map((file) => ({
      file,
      relativePath: file.webkitRelativePath || file.name,
    }));
}

/**
 * A partir de un dataframe obtiene el inventario total, filtrar COMPLETA = Saldo, agrupar por PAPER_CODE y WIDTH
 */

export function getTotalInventory(df) {
  const rows = dataFrameToRows(df);
  const aggregated = rows.reduce((accumulator, row) => {
    if (normalizeString(row?.COMPLETA) !== "SALDO") {
      return accumulator;
    }

    const paperCode = row?.PAPER_CODE ?? null;
    const width = row?.WIDTH ?? null;
    const key = `${paperCode ?? ""}::${width ?? ""}`;

    if (!accumulator.has(key)) {
      accumulator.set(key, {
        PAPER_CODE: paperCode,
        WIDTH: width,
        TOTAL_ROLLS: 0,
      });
    }

    const entry = accumulator.get(key);
    entry.TOTAL_ROLLS += 1;

    return accumulator;
  }, new Map());

  const data = Array.from(aggregated.values());

  if (data.length === 0) {
    return new dfd.DataFrame([], {
      columns: ["PAPER_CODE", "WIDTH", "TOTAL_ROLLS"],
    });
  }

  return new dfd.DataFrame(data, {
    columns: ["PAPER_CODE", "WIDTH", "TOTAL_ROLLS"],
  });
}

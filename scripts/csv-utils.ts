import { readFileSync } from "node:fs";

/** Tek bir CSV satırını noktalı virgüle göre, tırnakları dikkate alarak ayırır */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export interface CsvSection {
  header: string[];
  rows: Record<string, string>[];
}

/**
 * CSV dosyasını boş satırlarla ayrılmış bölümlere ayırır ve belirtilen
 * ilk kolon adıyla başlayan bölümü döndürür.
 */
export function readSections(filePath: string): CsvSection[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const sections: CsvSection[] = [];
  let currentHeader: string[] | null = null;
  let currentRows: Record<string, string>[] = [];

  const flush = () => {
    if (currentHeader) {
      sections.push({ header: currentHeader, rows: currentRows });
    }
    currentHeader = null;
    currentRows = [];
  };

  let prevBlank = true;
  for (const line of lines) {
    const isBlank = line.replace(/;/g, "").trim() === "";
    if (isBlank) {
      flush();
      prevBlank = true;
      continue;
    }
    const cols = parseCsvLine(line);
    if (prevBlank) {
      currentHeader = cols;
      currentRows = [];
    } else if (currentHeader) {
      const row: Record<string, string> = {};
      currentHeader.forEach((h, idx) => {
        if (h) row[h] = cols[idx] ?? "";
      });
      currentRows.push(row);
    }
    prevBlank = false;
  }
  flush();
  return sections;
}

/** İlk kolonu belirli bir isimle başlayan bölümü bulur */
export function findSection(sections: CsvSection[], firstColumn: string): CsvSection | null {
  return sections.find((s) => s.header[0] === firstColumn) ?? null;
}

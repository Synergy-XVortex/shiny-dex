/**
 * Minimal RFC 4180 CSV parser for the PokéAPI data dumps: comma separator,
 * double-quoted fields that may contain commas, newlines and escaped quotes.
 * Returns one object per data row, keyed by the header row.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = splitRows(text.replace(/^﻿/, ''));
  const [header, ...dataRows] = rows;
  if (!header) {
    return [];
  }
  return dataRows
    .filter((row) => row.length > 1 || row[0] !== '')
    .map((row) => Object.fromEntries(header.map((column, index) => [column, row[index] ?? ''])));
}

function splitRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

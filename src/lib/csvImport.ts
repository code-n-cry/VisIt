export interface CsvImportRow {
  date: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
}

const HEADERS: Record<keyof CsvImportRow, string[]> = {
  date: ["date", "дата", "time", "дата операции", "дата транзакции", "transaction date"],
  name: [
    "description",
    "name",
    "описание",
    "назначение",
    "назначение платежа",
    "комментарий",
    "details",
    "описание операции",
    "назначение",
    "title",
  ],
  amount: [
    "amount",
    "sum",
    "сумма",
    "дебет",
    "debit",
    "списание",
    "сумма операции",
    "amount debit",
    "сумма списания",
    "сумма в валюте",
  ],
  currency: ["currency", "валюта", "код валюты", "currency code", "валюта операции"],
  category: ["category", "категория", "категория траты"],
};

function detectDelimiter(line: string): string {
  const counts = [
    { char: "\t", count: (line.match(/\t/g) || []).length },
    { char: ";", count: (line.match(/;/g) || []).length },
    { char: ",", count: (line.match(/,/g) || []).length },
  ];
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].char : ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function findHeaderIndex(headerRow: string[], field: keyof CsvImportRow): number {
  const aliases = HEADERS[field];
  for (let i = 0; i < headerRow.length; i += 1) {
    const normalized = headerRow[i].toLowerCase().replace(/[\s_]/g, "");
    if (aliases.some((a) => normalized === a.toLowerCase().replace(/[\s_]/g, ""))) return i;
  }
  return -1;
}

function parseAmount(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(/\u00a0/g, "").replace("(", "-").replace(")", "");
  const dot = cleaned.replace(/,/g, "");
  const comma = cleaned.replace(/\./g, "").replace(",", ".");
  const num = Number(dot) || Number(comma);
  if (!Number.isFinite(num)) return null;
  return Math.abs(num);
}

function parseDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function parseBankCsv(text: string, fallbackCurrency: string): CsvImportRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("CSV слишком короткий: нужна шапка и хотя бы одна строка");

  const delimiter = detectDelimiter(lines[0]);
  const headerRow = splitCsvLine(lines[0], delimiter);

  const indices = {
    date: findHeaderIndex(headerRow, "date"),
    name: findHeaderIndex(headerRow, "name"),
    amount: findHeaderIndex(headerRow, "amount"),
    currency: findHeaderIndex(headerRow, "currency"),
    category: findHeaderIndex(headerRow, "category"),
  };

  if (indices.amount === -1) {
    throw new Error(
      "Не удалось найти колонку с суммой. Ожидаются заголовки: amount, сумма, debit, списание...",
    );
  }

  const rows: CsvImportRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i], delimiter);
    const rawAmount = cells[indices.amount];
    const amount = parseAmount(rawAmount);
    if (amount === null || amount === 0) continue;

    const rawDate = indices.date >= 0 ? cells[indices.date] : "";
    const rawName = indices.name >= 0 ? cells[indices.name] : "";
    const rawCurrency = indices.currency >= 0 ? cells[indices.currency] : "";
    const rawCategory = indices.category >= 0 ? cells[indices.category] : "";

    rows.push({
      date: parseDate(rawDate),
      name: rawName || "Импорт",
      amount,
      currency: rawCurrency.toUpperCase() || fallbackCurrency,
      category: rawCategory.trim() || "Импорт",
    });
  }

  return rows;
}

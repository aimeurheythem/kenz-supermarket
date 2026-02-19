/**
 * CSV utility functions for import/export operations.
 */

/**
 * Escapes a CSV field value properly, handling commas, quotes, and newlines.
 */
function escapeField(value: unknown): string {
    const str = value == null ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Export data to a CSV file and trigger browser download.
 */
export function exportToCsv(
    headers: { key: string; label: string }[],
    rows: Record<string, unknown>[],
    filename: string,
) {
    const headerLine = headers.map((h) => escapeField(h.label)).join(',');

    const dataLines = rows.map((row) => headers.map((h) => escapeField(row[h.key])).join(','));

    const csvContent = [headerLine, ...dataLines].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Parse a CSV file and return an array of objects keyed by header names.
 */
export async function parseCsvFile(file: File): Promise<Record<string, string>[]> {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) return [];

    const headers = parseCsvLine(lines[0]);
    const results: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
            row[header.trim()] = (values[idx] || '').trim();
        });
        results.push(row);
    }

    return results;
}

/**
 * Parse a single CSV line, respecting quoted fields.
 */
function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                fields.push(current);
                current = '';
            } else {
                current += char;
            }
        }
    }
    fields.push(current);
    return fields;
}

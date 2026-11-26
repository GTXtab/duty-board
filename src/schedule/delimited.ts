/** The clipboard uses tabs, the CSV export uses commas. */
export type Delimiter = '\t' | ',';

/** Spreadsheets quote cells that contain line breaks or delimiters, so a plain split is not enough. */
export const parseDelimited = (text: string, delimiter: Delimiter): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  const endCell = (): void => {
    row.push(cell.replace(/\s+/g, ' ').trim());
    cell = '';
  };
  const endRow = (): void => {
    endCell();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text.charAt(index + 1) === '"') {
        cell += '"';
        index += 1;
      } else quoted = false;
    } else if (char === '"' && cell === '') quoted = true;
    else if (char === delimiter) endCell();
    else if (char === '\n') endRow();
    else if (char !== '\r') cell += char;
  }

  if (cell !== '' || row.length > 0) endRow();
  return rows;
};

import { describe, expect, it } from 'vitest';
import { isOfficeFileLink, parseSheetLink, toCsvExportUrl } from './sheetLink';

const ID = 'abcdefghijklmnopqrstuvwxyz';

describe('toCsvExportUrl', () => {
  it('leaves the sheet choice to Google when the link has no gid', () => {
    expect(toCsvExportUrl(`https://docs.google.com/spreadsheets/d/${ID}`)).toBe(
      `https://docs.google.com/spreadsheets/d/${ID}/export?format=csv`,
    );
  });

  it.each([
    'not a link',
    `http://docs.google.com/spreadsheets/d/${ID}`,
    `https://docs.google.com.evil.test/spreadsheets/d/${ID}`,
    `https://evil.test/spreadsheets/d/${ID}`,
    'https://docs.google.com/spreadsheets/d/e/2PACX-published/pubhtml',
  ])('rejects %s', (link) => {
    expect(toCsvExportUrl(link)).toBeNull();
  });
});

describe('parseSheetLink', () => {
  it('prefers the gid from the fragment', () => {
    expect(parseSheetLink(`https://docs.google.com/spreadsheets/d/${ID}/edit?gid=1#gid=2`)).toEqual({
      id: ID,
      gid: '2',
    });
  });
});

describe('isOfficeFileLink', () => {
  it('recognises an Excel file opened in Drive', () => {
    const base = `https://docs.google.com/spreadsheets/d/${ID}/edit?usp=sharing`;
    expect(isOfficeFileLink(`${base}&rtpof=true&sd=true`)).toBe(true);
    expect(isOfficeFileLink(base)).toBe(false);
  });
});

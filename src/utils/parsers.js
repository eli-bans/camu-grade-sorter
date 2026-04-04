import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { parseCanvasName } from './normalize';

// ── Camu XLSX ────────────────────────────────────────────────────
export async function readCamuXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const keyRow = rows[0];
        const labelRow = rows[1];
        const students = [];
        for (let i = 2; i < rows.length; i++) {
          const r = rows[i];
          const rollNo = String(r[0] || '').trim();
          if (!/^\d+$/.test(rollNo)) continue;
          const obj = {};
          keyRow.forEach((k, idx) => { obj[k] = r[idx] !== undefined ? r[idx] : ''; });
          students.push(obj);
        }
        resolve({ keyRow, labelRow, students });
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Enrollment PDF ───────────────────────────────────────────────
export async function readEnrollmentPdf(file, pdfjsLib) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
        const rollToName = {};
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          const items = content.items.map(i => i.str.trim()).filter(Boolean);
          let i = 0;
          while (i < items.length) {
            if (/^\d+$/.test(items[i]) && i + 3 < items.length) {
              const rollNo = items[i + 2];
              let name = '';
              let j = i + 3;
              while (j < items.length && !/^\d+$/.test(items[j])) {
                if (/^(20\d{2}|[IVX]+|Year)$/.test(items[j])) { j++; continue; }
                if (name.split(' ').length >= 2 && /^[A-Z]{2,10}$/.test(items[j]) && items[j] !== items[j].toLowerCase()) break;
                name += (name ? ' ' : '') + items[j];
                j++;
              }
              if (rollNo && name && /\w/.test(name)) {
                rollToName[rollNo.trim()] = name.trim();
              }
              i = j;
            } else {
              i++;
            }
          }
        }
        resolve(rollToName);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Assessment column extractor ──────────────────────────────────
const META_COLS = new Set(['Student', 'ID', 'SIS User ID', 'SIS Login ID', 'Section']);

/**
 * From the Canvas headers + Points Possible row, return the list of
 * individual assessment columns (not summary/read-only columns).
 * Each entry: { colIdx, rawHeader, name, maxPoints }
 */
export function extractAssessments(headers, pointsPossibleRow) {
  if (!pointsPossibleRow) return [];
  const assessments = [];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!header || META_COLS.has(header)) continue;
    const possible = (pointsPossibleRow[i] || '').toString().trim();
    // Skip computed columns marked "(read only)" and empty columns
    if (!possible || possible === '(read only)') continue;
    const maxPoints = parseFloat(possible);
    if (isNaN(maxPoints) || maxPoints <= 0) continue;
    // Strip trailing Canvas ID suffix e.g. "Assignment 1 (70674)" → "Assignment 1"
    const name = header.replace(/\s*\(\d+\)\s*$/, '').trim();
    assessments.push({ colIdx: i, rawHeader: header, name, maxPoints });
  }
  return assessments;
}

// ── Canvas CSV ───────────────────────────────────────────────────
export async function readCanvasCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: false,
      complete: result => {
        const rows = result.data;
        if (!rows.length) return reject(new Error('Canvas CSV is empty'));
        const headers = rows[0];
        const studentIdx = headers.indexOf('Student');
        const emailIdx = headers.indexOf('SIS Login ID');
        if (studentIdx === -1) return reject(new Error('Canvas CSV missing "Student" column'));

        let pointsPossibleRow = null;
        const studentRows = [];

        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const student = (r[studentIdx] || '').trim();
          const email = (r[emailIdx] || '').trim();
          if (!student) continue;
          if (student === 'Points Possible') { pointsPossibleRow = r; continue; }
          // Skip test accounts (40-char hex)
          if (/^[0-9a-f]{40}$/.test(email)) continue;
          studentRows.push(r);
        }

        // Build lookup: normalizedName → row
        const canvasLookup = {};
        const canvasNames = [];
        for (const row of studentRows) {
          const rawName = row[studentIdx] || '';
          const norm = parseCanvasName(rawName);
          if (!norm) continue;
          canvasLookup[norm] = row;
          canvasNames.push({ raw: rawName, norm, email: row[emailIdx] || '' });
        }

        // Derive assessment columns from the Points Possible row
        const assessments = extractAssessments(headers, pointsPossibleRow);

        resolve({ headers, pointsPossibleRow, studentRows, studentIdx, emailIdx, canvasLookup, canvasNames, assessments });
      },
      error: reject,
    });
  });
}

import * as XLSX from 'xlsx';
import { parseCamuName } from './normalize';

/**
 * Match Camu students against Canvas lookup.
 * Returns { matched, camuUnmatched, canvasUnmatched, matchedCount }
 */
export function matchStudents(camuStudents, canvasLookup, canvasNames) {
  const matched = [];
  const camuUnmatched = [];
  const matchedCanvasNorms = new Set();

  for (const stu of camuStudents) {
    const camuName = stu['StuNm'] || '';
    const norm = parseCamuName(camuName);
    const canvasRow = canvasLookup[norm];
    if (canvasRow) {
      matched.push({ camu: stu, canvas: canvasRow });
      matchedCanvasNorms.add(norm);
    } else {
      camuUnmatched.push(stu);
      matched.push({ camu: stu, canvas: null });
    }
  }

  const canvasUnmatched = canvasNames.filter(c => !matchedCanvasNorms.has(c.norm));
  const matchedCount = matched.filter(m => m.canvas !== null).length;

  return { matched, camuUnmatched, canvasUnmatched, matchedCount };
}

const LABEL_MAP = {
  StuRollNo: 'Roll No',
  Mark: 'Marks',
  IsAbs: 'Is Absent',
  StuNm: 'Student Name',
  InEligible: 'InEligible',
  rsSts: 'Result Status',
};

/** Build the Camu-upload-ready 2D array */
export function buildCamuOutput(keyRow, labelRow, matched) {
  const out = [];
  out.push(keyRow);
  const labelRowOut = keyRow.map((k, idx) => LABEL_MAP[k] || labelRow[idx] || k);
  out.push(labelRowOut);
  for (const m of matched) {
    const stu = m.camu;
    const row = keyRow.map(k => {
      if (k === 'IsAbs') return 'N';
      if (k === 'Mark' || k === 'InEligible' || k === 'rsSts') return '';
      return stu[k] !== undefined ? stu[k] : '';
    });
    out.push(row);
  }
  return out;
}

/** Build the Canvas-reordered 2D array (with header row) */
export function buildCanvasOutput(headers, pointsPossibleRow, matched) {
  const rows = [];
  if (pointsPossibleRow) rows.push(pointsPossibleRow);
  for (const m of matched) {
    if (m.canvas) rows.push(m.canvas);
  }
  return { headers, rows };
}

export function downloadXlsx(data, sheetName, fileName) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

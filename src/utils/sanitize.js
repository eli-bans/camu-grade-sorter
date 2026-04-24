// ── Input file validation ────────────────────────────────────────

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Expected magic bytes for each file type
const MAGIC_BYTES = {
  // XLSX is an OOXML (ZIP) file: PK\x03\x04
  xlsx: [0x50, 0x4b, 0x03, 0x04],
  // PDF: %PDF
  pdf: [0x25, 0x50, 0x44, 0x46],
};

/**
 * Validate an uploaded file before parsing.
 * Checks file size and magic bytes (for xlsx/pdf).
 * Throws a descriptive Error on failure.
 */
export async function validateFile(file, type) {
  if (file.size === 0) {
    throw new Error(`${file.name} is empty.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name} exceeds the 20 MB size limit.`);
  }

  // CSV is plain text — no reliable magic bytes to check
  if (type === 'csv') return;

  const expected = MAGIC_BYTES[type];
  if (!expected) return;

  const buf = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buf);
  const valid = expected.every((b, i) => bytes[i] === b);

  if (!valid) {
    const label = type === 'xlsx' ? 'XLSX' : 'PDF';
    throw new Error(
      `"${file.name}" doesn't appear to be a valid ${label} file. ` +
      `Please check you've selected the correct file.`
    );
  }
}

// ── Output cell sanitization ─────────────────────────────────────

// Characters that spreadsheet apps (Excel, Sheets) treat as formula triggers
const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@', '\t', '\r']);

/**
 * Prevent formula injection in exported XLSX cells.
 * If a string value starts with a formula-trigger character,
 * prefix it with an apostrophe so it is treated as literal text.
 */
export function sanitizeCell(value) {
  if (typeof value !== 'string') return value;
  if (value.length > 0 && FORMULA_TRIGGERS.has(value[0])) {
    return "'" + value;
  }
  return value;
}

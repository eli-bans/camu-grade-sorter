import { useState } from 'react';
import UploadZone from './components/UploadZone';
import Results from './components/Results';
import { readCamuXlsx, readEnrollmentPdf, readCanvasCsv } from './utils/parsers';
import { matchStudents } from './utils/matcher';
import * as pdfjsLibStatic from 'pdfjs-dist/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Resolve the module object regardless of how Vite wraps the CJS build
const pdfjsLib = pdfjsLibStatic.GlobalWorkerOptions
  ? pdfjsLibStatic
  : pdfjsLibStatic.default;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// Spinner SVG
function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      <path d="M8 2a6 6 0 016 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function App() {
  const [files, setFiles] = useState({ xlsx: null, pdf: null, csv: null });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const allReady = files.xlsx && files.pdf && files.csv;

  const handleFile = (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    setResult(null);
    setError('');
  };

  const processFiles = async () => {
    setError('');
    setResult(null);
    setProcessing(true);
    try {
      const [camuData, , canvasData] = await Promise.all([
        readCamuXlsx(files.xlsx),
        readEnrollmentPdf(files.pdf, pdfjsLib),
        readCanvasCsv(files.csv),
      ]);

      const { keyRow, labelRow, students: camuStudents } = camuData;
      const { headers, pointsPossibleRow, canvasLookup, canvasNames, assessments } = canvasData;

      const { matched, camuUnmatched, canvasUnmatched, matchedCount } =
        matchStudents(camuStudents, canvasLookup, canvasNames);

      setResult({
        matchedCount,
        totalCamu: camuStudents.length,
        canvasUnmatched,
        camuUnmatched,
        matched,
        keyRow,
        labelRow,
        headers,
        pointsPossibleRow,
        assessments,
      });

      // Scroll to results after paint
      requestAnimationFrame(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      setError('Error processing files: ' + err.message);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page">
      <div className="header">
        <div className="header-top">
          <span className="header-badge">Internal Tool</span>
          <h1>Camu Grade Sorter</h1>
        </div>
        <p>
          Upload your three source files to match students across Camu and Canvas, then download
          both output files — one ready to upload to Camu, one reordered Canvas reference.
        </p>
      </div>

      <div className="section-label">Step 1 — Upload files</div>

      <div className="upload-grid">
        <UploadZone
          type="xlsx"
          label="Camu Result Template"
          accept=".xlsx,.xls"
          file={files.xlsx}
          onFile={f => handleFile('xlsx', f)}
        />
        <UploadZone
          type="pdf"
          label="Enrollment List"
          accept=".pdf"
          file={files.pdf}
          onFile={f => handleFile('pdf', f)}
        />
        <UploadZone
          type="csv"
          label="Canvas Grades Export"
          accept=".csv"
          file={files.csv}
          onFile={f => handleFile('csv', f)}
        />
      </div>

      <div className="process-row">
        <button
          className={`btn-process${processing ? ' processing' : ''}`}
          disabled={!allReady || processing}
          onClick={processFiles}
        >
          {processing ? <Spinner /> : null}
          <span className="btn-text">
            {processing ? 'Processing…' : 'Process Files'}
          </span>
        </button>
      </div>

      {error && <div className="error-box" style={{ display: 'block' }}>{error}</div>}

      {result && <Results result={result} />}

      <footer className="footer">
        Built by <span className="footer-name">Elikem Bansah</span>
      </footer>
    </div>
  );
}

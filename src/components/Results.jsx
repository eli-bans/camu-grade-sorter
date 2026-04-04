import UnmatchedList from './UnmatchedList';
import { downloadXlsx, buildCamuOutput, buildCanvasOutput } from '../utils/matcher';

const DownloadIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
    <path d="M8 10.5l-4-4h2.5V2h3v4.5H12L8 10.5zM2 12h12v1.5H2V12z"/>
  </svg>
);

export default function Results({ result }) {
  const { matchedCount, totalCamu, canvasUnmatched, camuUnmatched, matched, keyRow, labelRow, headers, pointsPossibleRow } = result;

  const handleDownloadCamu = () => {
    const data = buildCamuOutput(keyRow, labelRow, matched);
    downloadXlsx(data, 'CamuUpload', 'camu_upload_ready.xlsx');
  };

  const handleDownloadCanvas = () => {
    const { headers: h, rows } = buildCanvasOutput(headers, pointsPossibleRow, matched);
    downloadXlsx([h, ...rows], 'CanvasGrades', 'canvas_grades_camu_order.xlsx');
  };

  const hasWarning = canvasUnmatched.length > 0 || camuUnmatched.length > 0;
  const warningParts = [];
  if (canvasUnmatched.length) warningParts.push(`${canvasUnmatched.length} Canvas student(s) could not be matched`);
  if (camuUnmatched.length) warningParts.push(`${camuUnmatched.length} Camu student(s) not found in Canvas`);

  return (
    <div id="results">
      <hr className="divider" />
      <div className="section-label" style={{ marginBottom: 16 }}>Step 2 — Match summary</div>

      {hasWarning && (
        <div className="warning-banner">
          <span className="warning-icon">⚠</span>
          <span>{warningParts.join('. ')}. Review the lists below.</span>
        </div>
      )}

      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-num green">{matchedCount} / {totalCamu}</div>
          <div className="stat-desc">Students matched</div>
        </div>
        <div className="stat-card">
          <div className="stat-num amber">{canvasUnmatched.length}</div>
          <div className="stat-desc">In Canvas, not matched in Camu</div>
        </div>
        <div className="stat-card">
          <div className="stat-num amber">{camuUnmatched.length}</div>
          <div className="stat-desc">In Camu, not found in Canvas</div>
        </div>
      </div>

      <UnmatchedList
        title="Canvas only"
        tagClass="tag-amber"
        items={canvasUnmatched}
        renderRow={item => (
          <>
            <span className="unmatched-name">{item.raw}</span>
            <span className="unmatched-meta">{item.email}</span>
          </>
        )}
      />

      <UnmatchedList
        title="Camu only"
        tagClass="tag-red"
        items={camuUnmatched}
        renderRow={item => (
          <>
            <span className="unmatched-name">{item['StuRollNo']}</span>
            <span className="unmatched-meta">{item['StuNm']}</span>
          </>
        )}
      />

      <hr className="divider" />
      <div className="section-label" style={{ marginBottom: 16 }}>Step 3 — Download outputs</div>

      <div className="download-grid">
        <div className="download-card">
          <div className="download-card-label">Output 1</div>
          <h3>Camu Upload Ready</h3>
          <p>Fill in the Mark column, then upload this file to Camu.</p>
          <button className="btn-download" onClick={handleDownloadCamu}>
            <DownloadIcon />
            Download Camu Upload Ready
          </button>
        </div>
        <div className="download-card">
          <div className="download-card-label">Output 2</div>
          <h3>Canvas Grades (Camu Order)</h3>
          <p>Full Canvas grades reordered to match Camu sequence — use as reference.</p>
          <button className="btn-download" onClick={handleDownloadCanvas}>
            <DownloadIcon />
            Download Canvas Grades (Camu Order)
          </button>
        </div>
      </div>
    </div>
  );
}

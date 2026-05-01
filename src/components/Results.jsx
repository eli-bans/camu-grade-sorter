import { useState, useMemo } from 'react';
import UnmatchedList from './UnmatchedList';
import ManualLinker from './ManualLinker';
import AssessmentPicker from './AssessmentPicker';
import {
  downloadXlsx,
  buildCamuOutput,
  buildCanvasOutput,
  countDefaultedZeroScores,
} from '../utils/matcher';

const DownloadIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
    <path d="M8 10.5l-4-4h2.5V2h3v4.5H12L8 10.5zM2 12h12v1.5H2V12z"/>
  </svg>
);

function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-. ]/gi, '_').replace(/\s+/g, '_');
}

export default function Results({ result }) {
  const {
    matchedCount, totalCamu, canvasUnmatched, camuUnmatched,
    matched, keyRow, labelRow, headers, pointsPossibleRow, assessments = [],
  } = result;

  const [selectedAssessments, setSelectedAssessments] = useState(
    () => new Set(assessments.map(a => a.colIdx))
  );
  const [manualLinks, setManualLinks] = useState([]);

  const handleLink = (camuStu, canvasItem) => {
    setManualLinks(prev => [...prev, { camu: camuStu, canvasItem }]);
  };
  const handleUnlink = idx => {
    setManualLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const linkedCamuStudents = useMemo(() => new Set(manualLinks.map(l => l.camu)), [manualLinks]);
  const linkedCanvasNorms = useMemo(() => new Set(manualLinks.map(l => l.canvasItem.norm)), [manualLinks]);

  const effectiveCamuUnmatched = useMemo(
    () => camuUnmatched.filter(s => !linkedCamuStudents.has(s)),
    [camuUnmatched, linkedCamuStudents]
  );
  const effectiveCanvasUnmatched = useMemo(
    () => canvasUnmatched.filter(c => !linkedCanvasNorms.has(c.norm)),
    [canvasUnmatched, linkedCanvasNorms]
  );

  const effectiveMatched = useMemo(() => {
    const linkMap = new Map(manualLinks.map(l => [l.camu, l.canvasItem.row]));
    return matched.map(m =>
      m.canvas === null && linkMap.has(m.camu)
        ? { camu: m.camu, canvas: linkMap.get(m.camu) }
        : m
    );
  }, [matched, manualLinks]);

  const effectiveMatchedCount = useMemo(
    () => effectiveMatched.filter(m => m.canvas !== null).length,
    [effectiveMatched]
  );

  const hasWarning = effectiveCanvasUnmatched.length > 0 || effectiveCamuUnmatched.length > 0;
  const warningParts = [];
  if (effectiveCanvasUnmatched.length) warningParts.push(`${effectiveCanvasUnmatched.length} Canvas student(s) could not be matched`);
  if (effectiveCamuUnmatched.length) warningParts.push(`${effectiveCamuUnmatched.length} Camu student(s) not found in Canvas`);

  const handleDownloadCanvas = () => {
    const { headers: h, rows } = buildCanvasOutput(headers, pointsPossibleRow, effectiveMatched);
    downloadXlsx([h, ...rows], 'CanvasGrades', 'canvas_grades_camu_order.xlsx');
  };

  const handleDownloadAssessment = assessment => {
    const data = buildCamuOutput(keyRow, labelRow, effectiveMatched, assessment);
    const safeName = sanitizeFilename(assessment.name);
    downloadXlsx(data, 'CamuUpload', `camu_upload_${safeName}.xlsx`);
  };

  const selectedList = assessments.filter(a => selectedAssessments.has(a.colIdx));
  const defaultedZeroCount = countDefaultedZeroScores(effectiveMatched, selectedList);

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
          <div className="stat-num green">{effectiveMatchedCount} / {totalCamu}</div>
          <div className="stat-desc">Students matched</div>
        </div>
        <div className="stat-card">
          <div className="stat-num amber">{effectiveCanvasUnmatched.length}</div>
          <div className="stat-desc">In Canvas, not matched in Camu</div>
        </div>
        <div className="stat-card">
          <div className="stat-num amber">{effectiveCamuUnmatched.length}</div>
          <div className="stat-desc">In Camu, not found in Canvas</div>
        </div>
      </div>

      <UnmatchedList
        title="Canvas only"
        tagClass="tag-amber"
        items={effectiveCanvasUnmatched}
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
        items={effectiveCamuUnmatched}
        renderRow={item => (
          <>
            <span className="unmatched-name">{item['StuRollNo']}</span>
            <span className="unmatched-meta">{item['StuNm']}</span>
          </>
        )}
      />

      {(effectiveCamuUnmatched.length > 0 && effectiveCanvasUnmatched.length > 0) || manualLinks.length > 0 ? (
        <ManualLinker
          camuUnmatched={effectiveCamuUnmatched}
          canvasUnmatched={effectiveCanvasUnmatched}
          links={manualLinks}
          onLink={handleLink}
          onUnlink={handleUnlink}
        />
      ) : null}

      <hr className="divider" />

      {/* Assessment picker */}
      <AssessmentPicker
        assessments={assessments}
        selected={selectedAssessments}
        onChange={setSelectedAssessments}
      />

      <hr className="divider" />
      <div className="section-label" style={{ marginBottom: 16 }}>Step 4 — Download outputs</div>

      {defaultedZeroCount > 0 && (
        <div className="warning-banner" style={{ marginBottom: 14 }}>
          <span className="warning-icon">⚠</span>
          <span>
            {defaultedZeroCount} missing score value(s) (for example: dash, blank, N/A) were detected
            in selected assessments and will be exported as 0.00.
          </span>
        </div>
      )}

      <div className="info-banner" style={{ marginBottom: 16 }}>
        <span className="info-icon">i</span>
        <span>
          Disclaimer: Please quickly review generated files before Camu upload. This tool automates
          matching and mark filling, but final responsibility for grade accuracy remains with the
          lecturer/TA.
        </span>
      </div>

      {/* Per-assessment Camu upload files */}
      {selectedList.length > 0 ? (
        <div className="download-assessment-grid">
          {selectedList.map(a => (
            <div className="download-card" key={a.colIdx}>
              <div className="download-card-label">Camu Upload</div>
              <h3>{a.name}</h3>
              <p>Raw score out of {a.maxPoints} pts, to 2 d.p. Camu scales automatically.</p>
              <button className="btn-download" onClick={() => handleDownloadAssessment(a)}>
                <DownloadIcon />
                Download
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="picker-none-msg">No assessments selected — toggle some above to generate files.</p>
      )}

      {/* Canvas reference file always available */}
      <div className="download-ref-row">
        <div className="download-card download-card--ref">
          <div className="download-card-label">Reference</div>
          <h3>Canvas Grades (Camu Order)</h3>
          <p>Full Canvas export reordered to match Camu student sequence.</p>
          <button className="btn-download btn-download--secondary" onClick={handleDownloadCanvas}>
            <DownloadIcon />
            Download Canvas Grades (Camu Order)
          </button>
        </div>
      </div>
    </div>
  );
}

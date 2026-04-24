export default function AssessmentPicker({ assessments, selected, onChange }) {
  const allSelected = assessments.length > 0 && assessments.every(a => selected.has(a.colIdx));
  const noneSelected = assessments.every(a => !selected.has(a.colIdx));

  const toggle = colIdx => {
    const next = new Set(selected);
    if (next.has(colIdx)) next.delete(colIdx);
    else next.add(colIdx);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(assessments.map(a => a.colIdx)));
  const clearAll = () => onChange(new Set());

  const count = selected.size;

  return (
    <div className="picker-section">
      <div className="picker-header">
        <div>
          <div className="section-label" style={{ marginBottom: 4 }}>Step 3 — Select assessments</div>
          <p className="picker-sub">
            Choose which assessments to export. Each selected assessment generates its own
            Camu upload file with raw scores pre-filled (2 d.p.) — Camu scales automatically.
          </p>
        </div>
        <div className="picker-actions">
          <button className="btn-text-action" onClick={selectAll} disabled={allSelected}>Select all</button>
          <span className="picker-sep">·</span>
          <button className="btn-text-action" onClick={clearAll} disabled={noneSelected}>Clear all</button>
        </div>
      </div>

      <div className="picker-grid">
        {assessments.map(a => {
          const on = selected.has(a.colIdx);
          return (
            <button
              key={a.colIdx}
              className={`picker-card${on ? ' picker-card--on' : ''}`}
              onClick={() => toggle(a.colIdx)}
            >
              <span className={`picker-check${on ? ' picker-check--on' : ''}`}>
                {on ? '✓' : ''}
              </span>
              <span className="picker-name">{a.name}</span>
              <span className="picker-max">/{a.maxPoints}</span>
            </button>
          );
        })}
      </div>

      {count > 0 && (
        <div className="picker-count">
          {count} assessment{count !== 1 ? 's' : ''} selected — {count} file{count !== 1 ? 's' : ''} will be generated
        </div>
      )}
    </div>
  );
}

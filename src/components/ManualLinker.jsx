import { useState } from 'react';

export default function ManualLinker({ camuUnmatched, canvasUnmatched, links, onLink, onUnlink }) {
  const [selCamu, setSelCamu] = useState(null);
  const [selCanvas, setSelCanvas] = useState(null);

  const handleLink = () => {
    if (!selCamu || !selCanvas) return;
    onLink(selCamu, selCanvas);
    setSelCamu(null);
    setSelCanvas(null);
  };

  const canLink = selCamu && selCanvas;

  return (
    <div className="linker-section">
      <div className="linker-header">
        <span className="section-label" style={{ margin: 0 }}>Manual linking</span>
        <span className="linker-hint">Select one student from each column, then click Link.</span>
      </div>

      {links.length > 0 && (
        <div className="linker-established">
          {links.map((lk, i) => (
            <div className="linker-link-row" key={i}>
              <span className="linker-link-camu">{lk.camu['StuNm']}</span>
              <span className="linker-link-arrow">→</span>
              <span className="linker-link-canvas">{lk.canvasItem.raw}</span>
              <button className="linker-unlink" onClick={() => onUnlink(i)} title="Remove link">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="linker-columns">
        <div className="linker-col">
          <div className="linker-col-label">Unmatched in Camu</div>
          <div className="linker-list">
            {camuUnmatched.map((stu, i) => {
              const active = selCamu === stu;
              return (
                <button
                  key={i}
                  className={`linker-row${active ? ' linker-row--selected' : ''}`}
                  onClick={() => setSelCamu(active ? null : stu)}
                >
                  <span className="linker-row-name">{stu['StuNm']}</span>
                  <span className="linker-row-meta">{stu['StuRollNo']}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="linker-mid">
          <button className="btn-link" disabled={!canLink} onClick={handleLink}>
            Link
          </button>
        </div>

        <div className="linker-col">
          <div className="linker-col-label">Unmatched in Canvas</div>
          <div className="linker-list">
            {canvasUnmatched.map((item, i) => {
              const active = selCanvas === item;
              return (
                <button
                  key={i}
                  className={`linker-row${active ? ' linker-row--selected' : ''}`}
                  onClick={() => setSelCanvas(active ? null : item)}
                >
                  <span className="linker-row-name">{item.raw}</span>
                  <span className="linker-row-meta">{item.email}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

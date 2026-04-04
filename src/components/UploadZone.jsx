import { useRef } from 'react';

const ICONS = {
  xlsx: (
    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12h6m-3-3v6M7.5 21h9A2.5 2.5 0 0019 18.5v-13A2.5 2.5 0 0016.5 3h-9A2.5 2.5 0 005 5.5v13A2.5 2.5 0 007.5 21z"/>
    </svg>
  ),
  pdf: (
    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 21h10a2 2 0 002-2V7.414a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 0012.172 1H7a2 2 0 00-2 2v16a2 2 0 002 2z"/>
      <path d="M13 1v5a2 2 0 002 2h5"/>
    </svg>
  ),
  csv: (
    <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 17v-6l-2 2m0 0l-2-2m2 2h8M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
  ),
};

export default function UploadZone({ type, label, accept, file, onFile }) {
  const inputRef = useRef(null);

  const handleChange = e => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={`upload-zone${file ? ' ready' : ''}`}
      onClick={() => inputRef.current?.click()}
    >
      {ICONS[type]}
      <div className="upload-type">{type.toUpperCase()}</div>
      <div className="upload-label">{label}</div>
      <div className="upload-filename">
        {file ? file.name : 'Click to select file'}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

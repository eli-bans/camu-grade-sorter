export default function UnmatchedList({ title, tagClass, items, renderRow }) {
  if (!items.length) return null;
  return (
    <div className="unmatched-section">
      <div className="unmatched-header">
        <span className={`tag ${tagClass}`}>{title}</span>
        {tagClass === 'tag-amber'
          ? 'In Canvas but not matched in Camu — excluded from outputs'
          : 'In Camu but not found in Canvas — blank Mark row in Output 1'}
      </div>
      <div className="unmatched-list">
        {items.map((item, i) => (
          <div className="unmatched-row" key={i}>
            {renderRow(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

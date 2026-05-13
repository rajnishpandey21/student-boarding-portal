import React from 'react';
import { CHECKLIST_ITEMS } from '../config/checklist';

export default function ChecklistEditor({ checklist, onChange, onMarkAllYes, onClearAll, title, subtitle }) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="action-row">
          {onMarkAllYes ? (
            <button className="ghost-button" type="button" onClick={onMarkAllYes}>
              Mark all Yes
            </button>
          ) : null}
          {onClearAll ? (
            <button className="ghost-button" type="button" onClick={onClearAll}>
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      <div className="checklist-grid">
        {CHECKLIST_ITEMS.map((item, index) => (
          <article className="checklist-item" key={item.key}>
            <div>
              <span className="checklist-index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.label}</h3>
            </div>

            <div className="toggle-group">
              <button
                type="button"
                className={checklist[item.key] === 'YES' ? 'toggle-button active' : 'toggle-button'}
                onClick={() => onChange(item.key, 'YES')}
              >
                Yes
              </button>
              <button
                type="button"
                className={checklist[item.key] === 'NO' ? 'toggle-button active alt' : 'toggle-button alt'}
                onClick={() => onChange(item.key, 'NO')}
              >
                No
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

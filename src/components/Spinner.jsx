import React from 'react';

export function Spinner({ size = 'md' }) {
  return (
    <span className={`spinner spinner-${size}`} aria-hidden="true">
      <span className="spinner-core" />
    </span>
  );
}

export function LoadingPanel({ label = 'Loading...' }) {
  return (
    <div className="loading-panel" role="status" aria-live="polite">
      <div className="loading-visual">
        <Spinner />
        <div className="loading-shimmer">
          <span />
          <span />
          <span />
        </div>
      </div>
      <p>{label}</p>
    </div>
  );
}

export function ButtonSpinnerLabel({ loading, loadingLabel, children }) {
  return (
    <span className="button-stack">
      {loading ? <Spinner size="sm" /> : null}
      <span>{loading ? loadingLabel : children}</span>
    </span>
  );
}

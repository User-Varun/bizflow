import "../styles/loadingSpinner.css";

export function LoadingSpinner({
  label = "Loading...",
  fullscreen = false,
  minHeight,
}) {
  const className = fullscreen
    ? "loading-spinner-wrap loading-spinner-wrap-fullscreen"
    : "loading-spinner-wrap";

  return (
    <div className={className} style={minHeight ? { minHeight } : undefined}>
      <div className="loading-spinner" aria-hidden="true" />
      {label ? <p className="loading-spinner-label">{label}</p> : null}
    </div>
  );
}

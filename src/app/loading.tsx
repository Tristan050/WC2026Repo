export default function Loading() {
  return (
    <div className="loading-page" aria-label="Loading WorldCupClutch" aria-live="polite">
      {/* Topbar skeleton */}
      <div className="loading-topbar">
        <div className="skeleton loading-logo-sk" />
        <div style={{ display: "flex", gap: 8 }}>
          <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 20 }} />
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
        </div>
      </div>

      {/* Countdown banner skeleton */}
      <div className="loading-banner">
        <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 4 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[52, 52, 52, 52].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 58, borderRadius: 10 }} />
          ))}
        </div>
        <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4 }} />
      </div>

      {/* Main content skeleton */}
      <div className="loading-main">
        <div className="loading-grid">
          {/* Left — match feed */}
          <div className="loading-panel">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="skeleton" style={{ width: 120, height: 20, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 40, height: 20, borderRadius: 4 }} />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="loading-match-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div className="skeleton" style={{ width: "35%", height: 16, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 36, height: 28, borderRadius: 8 }} />
                  <div className="skeleton" style={{ width: "35%", height: 16, borderRadius: 4 }} />
                </div>
                <div className="skeleton" style={{ width: "100%", height: 6, borderRadius: 3 }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <div className="skeleton" style={{ width: 40, height: 18, borderRadius: 20 }} />
                  <div className="skeleton" style={{ width: 55, height: 18, borderRadius: 20 }} />
                  <div className="skeleton" style={{ width: 70, height: 18, borderRadius: 20 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Right — predict panel */}
          <div className="loading-panel">
            <div className="skeleton" style={{ width: 100, height: 20, borderRadius: 4, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: "100%", height: 80, borderRadius: 12, marginBottom: 16 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["HOME WIN", "DRAW", "AWAY WIN"].map(label => (
                <div key={label} className="skeleton" style={{ width: "100%", height: 52, borderRadius: 12 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav skeleton */}
      <div className="loading-bottom-nav">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ width: 44, height: 40, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}

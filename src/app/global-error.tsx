"use client";

// Replaces the root layout when it crashes, so it can't rely on globals.css or the theme script.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#12141a",
          color: "#f4f4f5",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 56, fontWeight: 900, color: "#e5333f" }}>Oops</div>
          <h1 style={{ fontSize: 24, margin: "12px 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#a1a1aa", maxWidth: 380, margin: "0 auto 24px", fontSize: 14 }}>
            Rasakatha.lk hit an unexpected error. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#e5333f", color: "#fff", border: 0, borderRadius: 999, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

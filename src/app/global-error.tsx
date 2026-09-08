"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Fatal Root Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0a0a0a", color: "#f5f5f5", fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: 0 }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ maxWidth: "480px", width: "100%", textAlign: "center", backgroundColor: "#171717", border: "1px solid #262626", borderRadius: "16px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "inline-flex", padding: "16px", borderRadius: "16px", backgroundColor: "rgba(244, 63, 94, 0.1)", color: "#fb7185", marginBottom: "16px" }}>
              <AlertTriangle style={{ width: "36px", height: "36px" }} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 8px 0", color: "#ffffff" }}>
              Application Error
            </h1>
            <p style={{ fontSize: "14px", color: "#a3a3a3", lineHeight: "1.5", margin: "0 0 24px 0" }}>
              A critical system error occurred. Please refresh or try reloading the application.
            </p>
            <button
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <RotateCcw style={{ width: "16px", height: "16px" }} /> Reload Application
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

// src/api/report.ts

export async function postReport(payload: any) {
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  const res = await fetch(`${API_BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Failed to save report: " + text);
  }

  return res.json();
}

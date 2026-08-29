"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { minuteIndexToTime } from "../lib/time";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<{ activeOwners: number; openReports: number; activeReservations: number } | null>(null);
  const [reports, setReports] = useState<Array<{ id: string; minute_index: number; reason: string; details: string; reporter_email: string; status: string }>>([]);
  const [error, setError] = useState("");

  async function loadData(key: string) {
    setError("");
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-key": key },
      });
      if (!res.ok) {
        setError("Unauthorized or invalid admin key.");
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setReports(data.reports || []);
      setAuthenticated(true);
    } catch {
      setError("Failed to connect to admin service.");
    }
  }

  async function handleReportAction(reportId: string, status: string) {
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action: "update_report", reportId, status }),
      });
      loadData(adminKey);
    } catch {
      // Ignore
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#08080a]">
      <SiteHeader />

      <div className="flex-1 max-w-[1200px] mx-auto w-full p-8">
        <span className="eyebrow text-[#ff4e24]">MODERATION & OPERATIONS</span>
        <h1 className="text-4xl font-extrabold text-white mt-1">Admin Command Center</h1>

        {!authenticated ? (
          <div className="mt-12 max-w-md rounded-2xl border border-white/10 bg-[#0f1014] p-8">
            <h3 className="text-lg font-bold text-white mb-2">Admin Authentication Required</h3>
            <p className="text-xs text-white/60 mb-6">
              Enter your `ADMIN_SECRET_KEY` to access moderation and database controls.
            </p>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Admin Secret Key"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#ff4e24]"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => loadData(adminKey)}
                className="btn-primary w-full"
              >
                Authenticate →
              </button>
            </div>
            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6">
                <span className="font-mono text-xs text-white/40">ACTIVE OWNERS</span>
                <div className="font-mono text-3xl font-bold text-white mt-1">
                  {stats?.activeOwners ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6">
                <span className="font-mono text-xs text-white/40">OPEN REPORTS</span>
                <div className="font-mono text-3xl font-bold text-yellow-400 mt-1">
                  {stats?.openReports ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6">
                <span className="font-mono text-xs text-white/40">ACTIVE RESERVATIONS</span>
                <div className="font-mono text-3xl font-bold text-emerald-400 mt-1">
                  {stats?.activeReservations ?? 0}
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="rounded-2xl border border-white/10 bg-[#0f1014] p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent User Reports</h3>
              {reports.length === 0 ? (
                <p className="text-xs text-white/40">No pending reports to review.</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#ff4e24]">
                            {minuteIndexToTime(report.minute_index)} UTC
                          </span>
                          <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
                            {report.reason}
                          </span>
                          <span className="font-mono text-xs text-white/40">
                            by {report.reporter_email}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">{report.details}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReportAction(report.id, "resolved")}
                          className="rounded-lg bg-emerald-500/20 text-emerald-400 px-3 py-1.5 font-mono text-xs hover:bg-emerald-500/30"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReportAction(report.id, "dismissed")}
                          className="rounded-lg bg-white/10 text-white/60 px-3 py-1.5 font-mono text-xs hover:bg-white/20"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}

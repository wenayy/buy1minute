export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="flex items-center gap-3">
        <span className="font-bold text-white">BUY1MINUTE</span>
        <span className="text-white/40">·</span>
        <span>1,440 scarce minutes of the internet</span>
      </div>

      <div className="footer-links">
        <a href="/explore" className="footer-link">Explore Grid</a>
        <a href="/leaderboard" className="footer-link">Leaderboard</a>
        <a href="/terms" className="footer-link">Terms & Guidelines</a>
        <a href="/report" className="footer-link">Report Listing</a>
      </div>

      <div className="text-white/40">
        Global UTC Clock Synchronization · 2026
      </div>
    </footer>
  );
}

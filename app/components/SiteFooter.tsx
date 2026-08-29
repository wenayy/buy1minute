import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>BUY1MINUTE © 2026</span>
      <div>
        <Link href="/terms">Terms</Link>
        <Link href="/report">Report a listing</Link>
        <span>1,440 minutes. One shared UTC clock.</span>
      </div>
    </footer>
  );
}


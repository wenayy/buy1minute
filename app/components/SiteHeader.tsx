import Link from "next/link";

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={`site-header ${inverse ? "site-header-inverse" : ""}`}>
      <Link className="wordmark" href="/" aria-label="Buy1Minute home">
        BUY<span>1</span>MINUTE
      </Link>
      <nav aria-label="Primary navigation">
        <a href="/explore">Explore</a>
        <a href="/leaderboard">Leaderboard</a>
        <a href="/how-it-works">How it works</a>
        <a href="/my-minutes">My minutes</a>
      </nav>
    </header>
  );
}

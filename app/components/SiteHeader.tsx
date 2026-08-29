import Link from "next/link";

export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={`site-header ${inverse ? "site-header-inverse" : ""}`}>
      <Link className="wordmark" href="/" aria-label="Buy1Minute home">
        BUY<span>1</span>MINUTE
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/explore">Explore</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/my-minutes">My minutes</Link>
      </nav>
    </header>
  );
}


export function SiteHeader({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={`site-header ${inverse ? "site-header-inverse" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a className="wordmark" href="/" aria-label="Buy1Minute home">
        BUY<span>1</span>MINUTE
      </a>
      <nav aria-label="Primary navigation">
        <a href="/explore">Explore</a>
        <a href="/leaderboard">Leaderboard</a>
        <a href="/how-it-works">How it works</a>
      </nav>
    </header>
  );
}

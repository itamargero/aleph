// The root path is rewritten to /Hebrew%20Heroes.html in next.config.ts.
// This page exists only so the App Router has a valid root entry; it should
// never render in production because the rewrite intercepts the request first.
export default function Home() {
  return null;
}

import { redirect } from "next/navigation";

// The game is bundled locally with a complete offline resource manifest.
// Its service worker also serves the cached HTML when opening / offline.
export default function Home() {
  redirect("/hebrew-heroes.html");
}

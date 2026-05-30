import { redirect } from "next/navigation";

// The interactive Hebrew Heroes prototype is a static HTML page served from
// public/. Redirect the root to it so the Next.js shell stays minimal.
export default function Home() {
  redirect("/hebrew-heroes.html");
}

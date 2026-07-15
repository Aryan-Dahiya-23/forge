import { redirect } from "next/navigation";

/** App entry → workspace create surface */
export default function Home() {
  redirect("/documents");
}

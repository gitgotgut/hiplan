import { redirect } from "next/navigation";

// hiplan has no marketing landing page — unauthenticated users are sent to
// hifamily SSO by middleware; authenticated users land on the events hub.
export default function Home() {
  redirect("/hub");
}

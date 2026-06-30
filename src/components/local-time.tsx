"use client";

import { format } from "date-fns";

// Renders a stored UTC instant in the viewer's local timezone. The server-side
// render uses the server tz; the client corrects on hydration (hence
// suppressHydrationWarning) so users always see their own local time.
export function LocalTime({ iso, fmt }: { iso: string; fmt: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {format(new Date(iso), fmt)}
    </time>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMyCircleIds } from "@/lib/circles";

function toICSDate(d: Date): string {
  // 2026-07-01T18:30:00.000Z -> 20260701T183000Z
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// GET /api/events/[id]/ics — download the event as an .ics calendar file
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { rsvps: { select: { userId: true } } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const myCircleIds = await getMyCircleIds(userId);
  const canView =
    event.hostId === userId ||
    event.rsvps.some((r) => r.userId === userId) ||
    (event.visibility === "OPEN" &&
      !!event.circleId &&
      myCircleIds.includes(event.circleId));
  if (!canView) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const start = event.startsAt;
  const end = event.endsAt ?? new Date(start.getTime() + 60 * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hiplan//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@hiplan`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICS(event.description)}` : null,
    event.location ? `LOCATION:${escapeICS(event.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${event.id}.ics"`,
    },
  });
}

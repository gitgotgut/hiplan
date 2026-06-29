import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rsvpSchema } from "@/lib/validations/event";

// PUT /api/events/[id]/rsvp — upsert the current user's RSVP
export async function PUT(
  req: NextRequest,
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
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Must be able to see the event to RSVP to it.
  const canView =
    event.hostId === userId ||
    event.visibility === "OPEN" ||
    event.rsvps.some((r) => r.userId === userId);
  if (!canView) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId: params.id, userId } },
    create: {
      eventId: params.id,
      userId,
      status: parsed.data.status,
      guests: parsed.data.guests,
      message: parsed.data.message,
    },
    update: {
      status: parsed.data.status,
      guests: parsed.data.guests,
      message: parsed.data.message,
    },
  });

  return NextResponse.json(rsvp);
}

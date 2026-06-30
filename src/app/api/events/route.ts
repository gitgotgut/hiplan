import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventCreateSchema } from "@/lib/validations/event";

// GET /api/events — events visible to the current user (hosted, open, or invited)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { hostId: userId },
        { rsvps: { some: { userId } } },
      ],
    },
    orderBy: { startsAt: "asc" },
    include: {
      host: { select: { id: true, displayName: true, email: true } },
      rsvps: { select: { status: true, guests: true, userId: true } },
    },
  });

  return NextResponse.json(events);
}

// POST /api/events — create an event hosted by the current user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = eventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      hostId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      capacity: parsed.data.capacity,
      visibility: parsed.data.visibility,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

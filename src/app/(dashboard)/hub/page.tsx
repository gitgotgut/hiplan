import Link from "next/link";
import { redirect } from "next/navigation";
import { format, isAfter, isSameMonth } from "date-fns";
import { Calendar, MapPin, Plus, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMyCircleIds } from "@/lib/circles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function goingCount(rsvps: { status: string; guests: number }[]) {
  return rsvps
    .filter((r) => r.status === "GOING")
    .reduce((total, r) => total + 1 + r.guests, 0);
}

const STATUS_LABEL: Record<string, string> = {
  GOING: "Going",
  MAYBE: "Maybe",
  NOT_GOING: "Can't go",
  PENDING: "Invited",
};

export default async function HubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;
  const myCircleIds = await getMyCircleIds(userId);

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { hostId: userId },
        { rsvps: { some: { userId } } },
        { visibility: "OPEN", circleId: { in: myCircleIds } },
      ],
    },
    orderBy: { startsAt: "asc" },
    include: {
      host: { select: { id: true, displayName: true, email: true } },
      rsvps: { select: { status: true, guests: true, userId: true } },
    },
  });

  const now = new Date();
  const upcoming = events.filter((e) => isAfter(new Date(e.startsAt), now));

  const awaitingResponse = upcoming.filter(
    (e) =>
      e.hostId !== userId &&
      !e.rsvps.some((r) => r.userId === userId && r.status !== "PENDING")
  ).length;

  const attendeesThisMonth = upcoming
    .filter((e) => isSameMonth(new Date(e.startsAt), now))
    .reduce((total, e) => total + goingCount(e.rsvps), 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Events</h1>
          <p className="text-muted-foreground">
            Create spontaneous plans and bring everyone together.
          </p>
        </div>
        <Button asChild size="lg" className="gap-2 shrink-0">
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            New Event
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{awaitingResponse}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendees This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{attendeesThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Upcoming
      </h2>

      {upcoming.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No upcoming events yet.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/events/new">
                <Plus className="h-4 w-4" />
                Plan something
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map((event) => {
            const mine = event.rsvps.find((r) => r.userId === userId);
            const isHost = event.hostId === userId;
            return (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{event.title}</span>
                        {isHost && <Badge variant="secondary">Hosting</Badge>}
                        {!isHost && mine && (
                          <Badge variant="outline">
                            {STATUS_LABEL[mine.status] ?? mine.status}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(event.startsAt), "EEE d MMM · HH:mm")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                      <Users className="h-4 w-4" />
                      {goingCount(event.rsvps)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

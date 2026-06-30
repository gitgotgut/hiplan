import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Users, Pencil, CalendarPlus } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMyCircleIds } from "@/lib/circles";
import { LocalTime } from "@/components/local-time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RsvpForm } from "./rsvp-form";
import { DeleteEventButton } from "./delete-event-button";

export const dynamic = "force-dynamic";

function personName(p: { displayName: string | null; email: string }) {
  return p.displayName ?? p.email;
}

const GROUPS: { key: string; label: string }[] = [
  { key: "GOING", label: "Going" },
  { key: "MAYBE", label: "Maybe" },
  { key: "NOT_GOING", label: "Can't go" },
];

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      host: { select: { id: true, displayName: true, email: true } },
      rsvps: {
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) notFound();

  const isHost = event.hostId === userId;
  const myRsvp = event.rsvps.find((r) => r.userId === userId);
  const myCircleIds = await getMyCircleIds(userId);
  const canView =
    isHost ||
    !!myRsvp ||
    (event.visibility === "OPEN" &&
      !!event.circleId &&
      myCircleIds.includes(event.circleId));
  if (!canView) notFound();

  const goingTotal = event.rsvps
    .filter((r) => r.status === "GOING")
    .reduce((total, r) => total + 1 + r.guests, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/hub"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        {isHost ? (
          <Badge variant="secondary" className="shrink-0">Hosting</Badge>
        ) : (
          <Badge variant="outline" className="shrink-0">
            {event.visibility === "OPEN" ? "Open event" : "Invite only"}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Hosted by {isHost ? "you" : personName(event.host)}
      </p>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              <LocalTime
                iso={event.startsAt.toISOString()}
                fmt="EEEE d MMMM yyyy · HH:mm"
              />
              {event.endsAt && (
                <>
                  {" – "}
                  <LocalTime iso={event.endsAt.toISOString()} fmt="HH:mm" />
                </>
              )}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {goingTotal} going
              {event.capacity ? ` · ${event.capacity} max` : ""}
            </span>
          </div>
          {event.description && (
            <p className="pt-2 whitespace-pre-wrap text-foreground">
              {event.description}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mb-6">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={`/api/events/${event.id}/ics`}>
            <CalendarPlus className="h-4 w-4" /> Add to calendar
          </a>
        </Button>
      </div>

      {!isHost && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Your RSVP</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpForm
              eventId={event.id}
              initialStatus={
                myRsvp && myRsvp.status !== "PENDING" ? myRsvp.status : null
              }
              initialGuests={myRsvp?.guests ?? 0}
              initialMessage={myRsvp?.message ?? ""}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {GROUPS.map(({ key, label }) => {
            const people = event.rsvps.filter((r) => r.status === key);
            if (people.length === 0) return null;
            return (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  {label} ({people.length})
                </p>
                <ul className="space-y-1 text-sm">
                  {people.map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span>{personName(r.user)}</span>
                      {r.guests > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +{r.guests}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {event.rsvps.filter((r) => r.status !== "PENDING").length === 0 && (
            <p className="text-sm text-muted-foreground">No responses yet.</p>
          )}
        </CardContent>
      </Card>

      {isHost && (
        <div className="mt-6 flex justify-end gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/events/${event.id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
          <DeleteEventButton eventId={event.id} />
        </div>
      )}
    </div>
  );
}

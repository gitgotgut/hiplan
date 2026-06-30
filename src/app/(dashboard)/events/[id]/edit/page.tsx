import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EditEventForm } from "./edit-event-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();
  if (event.hostId !== session.user.id) notFound();

  return (
    <EditEventForm
      id={event.id}
      title={event.title}
      description={event.description ?? ""}
      location={event.location ?? ""}
      startsAtIso={event.startsAt.toISOString()}
      endsAtIso={event.endsAt ? event.endsAt.toISOString() : ""}
      capacity={event.capacity ?? null}
    />
  );
}

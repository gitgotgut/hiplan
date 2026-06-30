"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

// Format a UTC instant as a local datetime-local input value (YYYY-MM-DDTHH:mm).
function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function EditEventForm({
  id,
  title,
  description,
  location,
  startsAtIso,
  endsAtIso,
  capacity,
}: {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAtIso: string;
  endsAtIso: string;
  capacity: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const startsRaw = (form.get("startsAt") as string) || "";
    const endsRaw = (form.get("endsAt") as string) || "";
    const capRaw = (form.get("capacity") as string) || "";

    const payload = {
      title: form.get("title"),
      description: (form.get("description") as string) || undefined,
      location: (form.get("location") as string) || undefined,
      startsAt: startsRaw ? new Date(startsRaw).toISOString() : undefined,
      endsAt: endsRaw ? new Date(endsRaw).toISOString() : null,
      capacity: capRaw ? Number(capRaw) : null,
    };

    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(`/events/${id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

      <Card>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required maxLength={120} defaultValue={title} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                maxLength={2000}
                defaultValue={description}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" maxLength={200} defaultValue={location} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Starts</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={isoToLocalInput(startsAtIso)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endsAt">Ends (optional)</Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={isoToLocalInput(endsAtIso)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                placeholder="No limit"
                defaultValue={capacity ?? ""}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save changes"}
              </Button>
              <Button asChild type="button" variant="ghost">
                <Link href={`/events/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

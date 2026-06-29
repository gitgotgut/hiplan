"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "GOING" | "MAYBE" | "NOT_GOING";

const OPTIONS: { value: Status; label: string }[] = [
  { value: "GOING", label: "Going" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NOT_GOING", label: "Can't go" },
];

export function RsvpForm({
  eventId,
  initialStatus,
  initialGuests,
  initialMessage,
}: {
  eventId: string;
  initialStatus: Status | null;
  initialGuests: number;
  initialMessage: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [guests, setGuests] = useState(String(initialGuests));
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit() {
    if (!status) {
      setError("Pick a response first.");
      return;
    }
    setError("");
    setSaved(false);
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        guests: Number(guests) || 0,
        message: message || undefined,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save your RSVP.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={status === opt.value ? "default" : "outline"}
            onClick={() => {
              setStatus(opt.value);
              setSaved(false);
            }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {status === "GOING" && (
        <div className="space-y-1.5">
          <Label htmlFor="guests">Bringing extra guests?</Label>
          <Input
            id="guests"
            type="number"
            min={0}
            max={20}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-28"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="message">Note for the host (optional)</Label>
        <Textarea
          id="message"
          rows={2}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">RSVP saved.</p>}

      <Button type="button" onClick={submit} disabled={loading}>
        {loading ? "Saving…" : "Save RSVP"}
      </Button>
    </div>
  );
}

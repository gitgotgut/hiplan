"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this event? This can't be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/hub");
      router.refresh();
    } else {
      setLoading(false);
      window.alert("Could not delete the event.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="gap-2 text-red-600 hover:text-red-700"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
      {loading ? "Deleting…" : "Delete event"}
    </Button>
  );
}

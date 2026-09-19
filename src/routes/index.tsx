import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { avatarUrl, fetchSlots, type LiveSlot } from "@/lib/liveSlots";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Room — Multi-Guest Stream" },
      {
        name: "description",
        content:
          "Watch the live room with up to six guests on screen, real-time chat and gifts.",
      },
      { property: "og:title", content: "Live Room — Multi-Guest Stream" },
      {
        property: "og:description",
        content: "Six guest seats, live chat and gifts in one mobile live room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveRoom,
});

function GuestTile({ slot }: { slot: LiveSlot }) {
  const src = avatarUrl(slot);

  if (!src) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center rounded-xl border border-border bg-tile text-muted-foreground">
        <span className="text-3xl leading-none text-foreground">+</span>
        <span className="mt-1 text-xs text-foreground">Request</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-tile">
      <img
        src={src}
        alt={slot.display_name ?? slot.username ?? "Guest"}
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
      <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-chip px-1.5 py-0.5 text-[10px] font-medium backdrop-blur">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
        {slot.viewers ?? "0"}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={src}
          alt={slot.display_name ?? slot.username ?? "Guest"}
          className="h-[52%] w-[52%] rounded-full border-2 border-white/70 object-cover"
        />
      </div>
      <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1 rounded-full bg-chip px-2 py-0.5 backdrop-blur">
          <span className="truncate text-[11px] font-semibold">
            {slot.display_name || slot.username}
          </span>
          <span className="text-[11px] text-muted-foreground">+</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {slot.muted ? "🔇" : "🎙"}
        </span>
      </div>
    </div>
  );
}

function LiveRoom() {
  const [slots, setSlots] = useState<LiveSlot[]>([]);

  useEffect(() => {
    let active = true;
    fetchSlots()
      .then((rows) => active && setSlots(rows))
      .catch(() => undefined);

    const channel = supabase
      .channel("live_slots_room")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_slots" },
        () => {
          fetchSlots()
            .then((rows) => active && setSlots(rows))
            .catch(() => undefined);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filled: LiveSlot[] =
    slots.length === 6
      ? slots
      : Array.from({ length: 6 }, (_, i) => ({
          slot_number: i + 1,
          username: null,
          display_name: null,
          viewers: null,
          source: "tiktok",
          muted: false,
        }));

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background text-foreground">
      <div className="flex gap-1.5 p-1.5">
        <div className="relative w-1/2 overflow-hidden rounded-xl bg-[linear-gradient(160deg,oklch(0.78_0.09_60),oklch(0.68_0.11_55))]">
          <div className="aspect-[9/16]" />
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-live px-2 py-0.5 text-[10px] font-bold text-live-foreground">
            LIVE
          </div>
          <div className="absolute inset-x-0 bottom-2 text-center text-[11px] font-medium text-black/60">
            Host camera
          </div>
        </div>
        <div className="grid w-1/2 grid-cols-2 gap-1.5">
          {filled.map((slot) => (
            <GuestTile key={slot.slot_number} slot={slot} />
          ))}
        </div>
      </div>

    </div>
  );
}

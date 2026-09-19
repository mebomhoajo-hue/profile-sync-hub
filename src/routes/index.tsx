import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { avatarUrl, fetchSlots, type LiveSlot } from "@/lib/liveSlots";
import hostKing from "@/assets/host-dubai-king.jpg";

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#2fc9b8" />
      <circle cx="12" cy="12" r="11" fill="url(#coinShade)" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#0e4f47" strokeWidth="1.6" />
      <path
        d="M12 6.4v11.2M14.8 8.9c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.9.8-2.9 2.1 0 2.9 5.8 1.5 5.8 4.4 0 1.3-1.3 2.1-2.9 2.1-1.4 0-2.6-.6-3-1.6"
        fill="none"
        stroke="#0e4f47"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="coinShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8ff5e6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0e4f47" stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function formatCoins(startedAt: number, now: number) {
  const elapsed = Math.max(0, now - startedAt);
  const coins = Math.min(1_000_000, Math.floor(elapsed / 1_500) * 40_000);

  if (coins >= 1_000_000) return "1M";
  return coins === 0 ? "0" : `${coins / 1_000}K`;
}

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

function GuestTile({ slot, now }: { slot: LiveSlot; now: number }) {
  const src = avatarUrl(slot);
  const [startedAt] = useState(() => Date.now());

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
      <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-chip px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
        <CoinIcon />
        {formatCoins(startedAt, now)}
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
          {slot.muted && <span className="text-[11px] text-muted-foreground">🔇</span>}
      </div>
    </div>
  );
}

function LiveRoom() {
  const [slots, setSlots] = useState<LiveSlot[]>([]);
  const [now, setNow] = useState(() => Date.now());

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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
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
           updated_at: undefined,
        }));

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background text-foreground">
      <div className="flex gap-1.5 p-1.5">
        <div className="host-lights relative w-1/2 overflow-hidden rounded-xl">
          <img
            src={hostKing}
            alt="Host"
            width={768}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="aspect-[9/16]" />
        </div>
        <div className="grid w-1/2 grid-cols-2 gap-1.5">
          {filled.map((slot) => (
            <GuestTile
              key={`${slot.slot_number}:${slot.username ?? "empty"}:${slot.updated_at ?? "new"}`}
              slot={slot}
              now={now}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

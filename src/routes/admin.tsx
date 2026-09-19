import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AVATAR_SOURCES,
  avatarUrl,
  fetchSlots,
  saveSlot,
  type LiveSlot,
} from "@/lib/liveSlots";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Live Room Seats" },
      {
        name: "description",
        content:
          "Control the six guest seats of the live room: set usernames, names and viewer counts.",
      },
      { property: "og:title", content: "Admin Panel — Live Room Seats" },
      {
        property: "og:description",
        content: "Set the username for each of the six live guest seats.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPanel,
});

function AdminPanel() {
  const [slots, setSlots] = useState<LiveSlot[]>([]);
  const [active, setActive] = useState<number>(1);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    fetchSlots()
      .then(setSlots)
      .catch(() => setStatus("Could not load the seats."));
  }, []);

  const current = slots.find((s) => s.slot_number === active);

  function patch(changes: Partial<LiveSlot>) {
    setSlots((prev) =>
      prev.map((s) => (s.slot_number === active ? { ...s, ...changes } : s)),
    );
  }

  async function onSave() {
    if (!current) return;
    setStatus("Saving...");
    try {
      await saveSlot(current);
      setStatus(`Seat ${current.slot_number} updated.`);
    } catch {
      setStatus("Saving failed. Try again.");
    }
  }

  async function onClear() {
    if (!current) return;
    const cleared = { ...current, username: null, display_name: null, viewers: null };
    patch(cleared);
    try {
      await saveSlot(cleared);
      setStatus(`Seat ${current.slot_number} cleared.`);
    } catch {
      setStatus("Clearing failed. Try again.");
    }
  }

  const preview = current ? avatarUrl(current) : null;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background px-4 py-6 text-foreground">
      <header className="mb-5">
        <h1 className="text-xl font-bold">Live seats admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a seat, enter a username, and it shows in the live room instantly.
        </p>
      </header>

      <div className="grid grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            onClick={() => setActive(n)}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              active === n
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {current && (
        <div className="mt-5 space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
              {preview && (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Live preview of seat {current.slot_number}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Profile source</span>
            <select
              value={current.source}
              onChange={(e) => patch({ source: e.target.value })}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground"
            >
              {AVATAR_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Username</span>
            <input
              value={current.username ?? ""}
              maxLength={60}
              placeholder="@username"
              onChange={(e) => patch({ username: e.target.value })}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Display name</span>
            <input
              value={current.display_name ?? ""}
              maxLength={40}
              placeholder="Shown on the tile"
              onChange={(e) => patch({ display_name: e.target.value })}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder:text-muted-foreground"
            />
          </label>

          <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            Guest coins start at 0 and rise automatically after saving.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={current.muted}
              onChange={(e) => patch({ muted: e.target.checked })}
            />
            <span className="text-muted-foreground">Show as muted</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onSave}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Save seat {current.slot_number}
            </button>
            <button
              onClick={onClear}
              className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              Clear
            </button>
          </div>

          {status && <p className="text-xs text-muted-foreground">{status}</p>}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          Back to live room
        </Link>
      </div>
    </div>
  );
}

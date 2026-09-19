import { supabase } from "@/integrations/supabase/client";

export type LiveSlot = {
  slot_number: number;
  username: string | null;
  display_name: string | null;
  viewers: string | null;
  source: string;
  muted: boolean;
  updated_at?: string;
};

export const AVATAR_SOURCES = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X (Twitter)" },
  { id: "youtube", label: "YouTube" },
  { id: "github", label: "GitHub" },
  { id: "telegram", label: "Telegram" },
] as const;

export function avatarUrl(slot: LiveSlot): string | null {
  if (!slot.username) return null;
  const handle = slot.username.trim().replace(/^@/, "");
  if (!handle) return null;
  return `https://unavatar.io/${slot.source}/${encodeURIComponent(handle)}?fallback=https://unavatar.io/${encodeURIComponent(handle)}`;
}

export async function fetchSlots(): Promise<LiveSlot[]> {
  const { data, error } = await supabase
    .from("live_slots")
    .select("slot_number, username, display_name, viewers, source, muted, updated_at")
    .order("slot_number");
  if (error) throw error;
  return (data ?? []) as LiveSlot[];
}

export async function saveSlot(slot: LiveSlot) {
  const { error } = await supabase
    .from("live_slots")
    .update({
      username: slot.username,
      display_name: slot.display_name,
      viewers: slot.viewers,
      source: slot.source,
      muted: slot.muted,
      updated_at: new Date().toISOString(),
    })
    .eq("slot_number", slot.slot_number);
  if (error) throw error;
}

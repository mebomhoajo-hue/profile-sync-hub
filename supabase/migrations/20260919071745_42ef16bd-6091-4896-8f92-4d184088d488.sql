CREATE TABLE public.live_slots (
  slot_number INT PRIMARY KEY CHECK (slot_number BETWEEN 1 AND 6),
  username TEXT,
  display_name TEXT,
  viewers TEXT,
  source TEXT NOT NULL DEFAULT 'tiktok',
  muted BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_slots TO anon, authenticated;
GRANT ALL ON public.live_slots TO service_role;

ALTER TABLE public.live_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live slots" ON public.live_slots FOR SELECT USING (true);
CREATE POLICY "Anyone can insert live slots" ON public.live_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update live slots" ON public.live_slots FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO public.live_slots (slot_number, username, display_name, viewers, source) VALUES
  (1, 'tiktok', 'ZeM', '603,8K', 'tiktok'),
  (2, 'charlidamelio', 'AMOR', '1,1M', 'tiktok'),
  (3, NULL, NULL, NULL, 'tiktok'),
  (4, NULL, NULL, NULL, 'tiktok'),
  (5, NULL, NULL, NULL, 'tiktok'),
  (6, NULL, NULL, NULL, 'tiktok');

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_slots;
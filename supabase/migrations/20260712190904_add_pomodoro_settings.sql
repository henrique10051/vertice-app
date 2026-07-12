ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pomodoro_focus_duration integer NOT NULL DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pomodoro_short_break integer NOT NULL DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pomodoro_long_break integer NOT NULL DEFAULT 15;

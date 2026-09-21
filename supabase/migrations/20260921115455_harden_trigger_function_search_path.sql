-- Applied to ACESSORA-SOL.IA on 2026-09-21.
-- Hardens trigger functions flagged by Supabase Security Advisor without changing their behavior.
alter function public.handle_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.handle_new_user_profile() set search_path = '';

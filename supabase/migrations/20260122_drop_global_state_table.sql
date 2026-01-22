-- Drop global_state table and all related objects
-- This removes the loading screen functionality from the database

-- Drop policies first
DROP POLICY IF EXISTS "Anyone can view global state" ON global_state;
DROP POLICY IF EXISTS "Anyone can update global state" ON global_state;
DROP POLICY IF EXISTS "Allow public read access" ON public.global_state;
DROP POLICY IF EXISTS "Allow public update access" ON public.global_state;
DROP POLICY IF EXISTS "Allow public insert access" ON public.global_state;

-- Drop index
DROP INDEX IF EXISTS idx_global_state_key;

-- Drop table
DROP TABLE IF EXISTS global_state CASCADE;
DROP TABLE IF EXISTS public.global_state CASCADE;

-- Budgets used to be upserted on (user_id, month, type, category), so a second
-- forecast entry in the same category silently overwrote the first instead of
-- being added as its own line with its own description. Drop that constraint
-- so each entry is its own row; totals are summed client-side across rows.
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_month_type_category_key;

-- Migration: Add sub_category to finance_expenses
ALTER TABLE public.finance_expenses ADD COLUMN IF NOT EXISTS sub_category TEXT;

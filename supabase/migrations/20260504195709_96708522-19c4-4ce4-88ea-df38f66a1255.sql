ALTER TABLE public.organization_members 
ADD COLUMN commission_rate NUMERIC(5,2);

COMMENT ON COLUMN public.organization_members.commission_rate IS 'Individual commission rate for the salesperson in percentage.';
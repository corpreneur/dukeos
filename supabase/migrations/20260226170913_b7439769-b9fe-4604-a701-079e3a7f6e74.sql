
-- Add cancellation_reason to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Allow customers to update their own subscriptions (for cancellation)
CREATE POLICY "Customers update own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

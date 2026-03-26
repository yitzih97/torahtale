
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  child_name text,
  art_style text DEFAULT 'cartoon',
  language text DEFAULT 'english',
  status text NOT NULL DEFAULT 'active',
  frequency text NOT NULL DEFAULT 'weekly',
  price_per_week numeric(10,2) NOT NULL DEFAULT 24.99,
  shipping_data jsonb,
  next_delivery_date date DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own subscriptions"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

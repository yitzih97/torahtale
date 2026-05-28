CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.book_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reviewer_name TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);

GRANT SELECT ON public.book_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_reviews TO authenticated;
GRANT ALL ON public.book_reviews TO service_role;

ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own reviews"
ON public.book_reviews
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone reads approved reviews"
ON public.book_reviews
FOR SELECT
TO anon, authenticated
USING (approved = true);

CREATE POLICY "Admins manage all reviews"
ON public.book_reviews
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_book_reviews_book_id ON public.book_reviews(book_id);
CREATE INDEX idx_book_reviews_user_id ON public.book_reviews(user_id);

CREATE TRIGGER update_book_reviews_updated_at
BEFORE UPDATE ON public.book_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
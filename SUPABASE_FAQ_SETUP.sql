-- ─────────────────────────────────────────────────────────────
-- SUPABASE: FAQ Table Setup
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Create the faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id          TEXT        PRIMARY KEY,
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  order_index INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone (guests) to READ faqs (public invitation page)
CREATE POLICY "Public can read faqs"
  ON public.faqs
  FOR SELECT
  USING (true);

-- 4. Allow authenticated admin to INSERT faqs
CREATE POLICY "Admin can insert faqs"
  ON public.faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Allow authenticated admin to UPDATE faqs
CREATE POLICY "Admin can update faqs"
  ON public.faqs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Allow authenticated admin to DELETE faqs
CREATE POLICY "Admin can delete faqs"
  ON public.faqs
  FOR DELETE
  TO authenticated
  USING (true);

-- 7. Seed with default FAQs (optional — remove if you want to start fresh)
INSERT INTO public.faqs (id, question, answer, order_index) VALUES
  ('faq-1', 'What is the dress code?',    'We request guests to wear formal or traditional attire. Pastels, champagne, or elegant cream tones are highly welcome.', 1),
  ('faq-2', 'Is parking available?',      'Complimentary valet parking is available directly at the entrance of the venue.',                                          2),
  ('faq-3', 'Can I bring extra guests?',  'Your invitation is configured for a set number of attendees. Please specify the count when you RSVP.',                   3),
  ('faq-4', 'What time should I arrive?', 'The Church ceremony starts sharp at 10:30 AM. We recommend arriving 15 minutes early to find your seats.',               4)
ON CONFLICT (id) DO NOTHING;

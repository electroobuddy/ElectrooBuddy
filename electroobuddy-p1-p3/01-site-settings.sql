-- ElectrooBuddy P1: only write business details you have actually filled in.
-- Replace empty strings below with verified values. Empty strings are ignored.
-- Existing nonempty settings are not overwritten by this seed.
-- Defaults in server/src/config/env.ts define these public keys.
BEGIN;
WITH supplied(key, value) AS (
  VALUES
    ('phone_number', '+917000395039'),      -- Example format: +91XXXXXXXXXX
    ('whatsapp_number', '+917000395039'),   -- Business WhatsApp, digits including country code
    ('email', 'electroobuddy@gmail.com'),             -- Public business contact email
    ('address', '05, Nagziri Dewas Road, Ujjain (456010), India'),           -- Public business address
    ('business_hours', 'Mon-Fri 9AM-6PM'),    -- Actual operating hours
    ('facebook_url', 'https://facebook.com/electroobuddy'),
    ('instagram_url', 'https://instagram.com/electroobuddy'),
    ('youtube_url', 'https://youtube.com/electroobuddy'),
    ('linkedin_url', 'https://linkedin.com/company/electroobuddy'),
    ('x_url', 'https://x.com/electroobuddy')
)
INSERT INTO public.site_settings (key, value, updated_at)
SELECT key, btrim(value), now()
FROM supplied
WHERE btrim(value) <> ''
ON CONFLICT (key) DO NOTHING;
COMMIT;

-- Read existing settings (no secrets should be stored here):
SELECT key, value FROM public.site_settings
WHERE key IN ('phone_number','whatsapp_number','email','address','business_hours',
              'facebook_url','instagram_url','youtube_url','linkedin_url','x_url')
ORDER BY key;

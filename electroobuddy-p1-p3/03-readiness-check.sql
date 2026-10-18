-- P1/P3 post-seed verification; read only.
SELECT 'public settings filled' AS metric, count(*)::bigint AS n
FROM public.site_settings WHERE key IN
('phone_number','whatsapp_number','email','address','business_hours','facebook_url','instagram_url','youtube_url','linkedin_url','x_url')
UNION ALL
SELECT 'active product categories',count(*) FROM public.product_categories WHERE is_active=true
UNION ALL
SELECT 'active products',count(*) FROM public.products WHERE is_active=true AND deleted_at IS NULL
UNION ALL
SELECT 'products with category text',count(*) FROM public.products WHERE category IS NOT NULL AND btrim(category)<>'';

-- Category text values that do not match any category name or slug (for review):
SELECT DISTINCT p.category
FROM public.products p
WHERE p.category IS NOT NULL AND btrim(p.category)<>''
 AND NOT EXISTS(SELECT 1 FROM public.product_categories c
                WHERE lower(c.name)=lower(p.category) OR lower(c.slug)=lower(p.category))
ORDER BY 1;

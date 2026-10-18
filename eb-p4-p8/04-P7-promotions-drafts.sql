-- P7: inactive demonstrations only. No active discounts or expired campaign text.
BEGIN;
INSERT INTO public.coupons (code,description,discount_type,discount_value,minimum_cart_items,is_active,auto_apply,applicable_to_all)
VALUES ('DRAFTWELCOME','Inactive template: set benefit, eligibility, min order, caps, valid dates, and campaign budget.','fixed',0,1,false,false,false)
ON CONFLICT (code) DO NOTHING;
INSERT INTO public.offers (title,description,type,value,visibility,cta_text,cta_link,status,is_active)
SELECT 'DRAFT: Seasonal electrical service offer','Inactive promotional placeholder; approve real copy, price and terms before publishing.','flat',0,ARRAY['home_hero']::text[],'View Services','/#request-service','inactive',false
WHERE NOT EXISTS(SELECT 1 FROM public.offers WHERE title='DRAFT: Seasonal electrical service offer');
COMMIT;

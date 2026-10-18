-- P6: inactive illustrative maintenance plan drafts, terms/prices pending approval.
BEGIN;
INSERT INTO public.subscription_plans (name,price,currency,duration_days,description,features,max_service_calls,parts_discount_percent,has_priority_support,is_active)
VALUES
('DRAFT: Home Care Basic',0,'INR',365,'Not for sale; confirm scope, exclusions, visits, fair usage, and price.','[]'::jsonb,0,0,false,false),
('DRAFT: Home Care Plus',0,'INR',365,'Not for sale; confirm scope, exclusions, visits, fair usage, and price.','[]'::jsonb,0,0,false,false),
('DRAFT: Business Electrical Care',0,'INR',365,'Not for sale; confirm service area, site size, visits, SLA, and price.','[]'::jsonb,0,0,false,false)
ON CONFLICT (name) DO NOTHING;
COMMIT;

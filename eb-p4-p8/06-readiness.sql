SELECT 'products' section, count(*) total, count(*) FILTER (WHERE is_active) active FROM public.products
UNION ALL SELECT 'shipping_zones',count(*),count(*) FILTER (WHERE is_active) FROM public.shipping_zones
UNION ALL SELECT 'shipping_rates',count(*),count(*) FILTER (WHERE is_active) FROM public.shipping_rates
UNION ALL SELECT 'tax_slabs',count(*),count(*) FILTER (WHERE is_active) FROM public.tax_slabs
UNION ALL SELECT 'subscription_plans',count(*),count(*) FILTER (WHERE is_active) FROM public.subscription_plans
UNION ALL SELECT 'coupons',count(*),count(*) FILTER (WHERE is_active) FROM public.coupons
UNION ALL SELECT 'offers',count(*),count(*) FILTER (WHERE is_active) FROM public.offers
UNION ALL SELECT 'testimonials',count(*),0 FROM public.testimonials
UNION ALL SELECT 'projects',count(*),0 FROM public.projects
UNION ALL SELECT 'team_members',count(*),0 FROM public.team_members;
SELECT p.name,p.category,p.price,p.inventory_quantity,p.is_active FROM public.products p WHERE p.slug LIKE 'draft-%' ORDER BY p.sort_order;
SELECT name,states,is_active FROM public.shipping_zones WHERE name LIKE 'DRAFT:%';

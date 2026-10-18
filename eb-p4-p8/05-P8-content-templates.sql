-- P8: no fabricated reviews, past projects or staff biographies are inserted.
-- Populate through admin CMS using verified permissioned customer, project and team details.
-- Illustrative INSERT shapes (commented deliberately):
-- INSERT INTO public.testimonials(name,rating,text,service,image_url)
-- VALUES ('REAL CUSTOMER NAME',5,'VERIFIED CUSTOMER WORDS','Actual completed service',NULL);
-- INSERT INTO public.projects(title,description,category,image_url)
-- VALUES ('REAL COMPLETED PROJECT','Accurate summary','Electrical',NULL);
-- INSERT INTO public.team_members(name,role,bio,photo_url,sort_order)
-- VALUES ('REAL TEAM MEMBER','Electrician','Approved biography',NULL,10);
SELECT 'P8 real content templates only: no rows inserted' AS note;

-- P5: inactive shipping geography and an inactive tax placeholder.
-- Confirm deliverable regions, courier rates, product tax codes, and applicable GST with your accountant.
BEGIN;
INSERT INTO public.shipping_zones (name,states,is_active)
SELECT v.name,v.states,false FROM (VALUES
 ('DRAFT: Madhya Pradesh',ARRAY['Madhya Pradesh']::text[]),
 ('DRAFT: Rest of India',ARRAY['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Chandigarh','Puducherry','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu','Lakshadweep']::text[])
) AS v(name,states)
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones z WHERE z.name=v.name);
-- No shipping_rates inserted: charging customers zero accidentally would be unsafe.
INSERT INTO public.tax_slabs (name,rate,description,applicable_to_all,is_active)
SELECT 'DRAFT: GST classification pending',0,'Inactive placeholder; determine GST rate by HSN/product category. Do not activate as 0% tax.',false,false
WHERE NOT EXISTS (SELECT 1 FROM public.tax_slabs WHERE name='DRAFT: GST classification pending');
COMMIT;

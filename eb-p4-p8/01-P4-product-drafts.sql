-- P4: 15 illustrative UNPUBLISHED product drafts. NOT real stock or sale prices.
-- Uses product category names (the app's products.category is text, not category_id).
-- Review name, description, SKU, image, price, stock, weight, tax classification before publishing.
BEGIN;
WITH draft(name,slug,description,sku,category,sort_order) AS (
 VALUES
 ('1.5 sq mm Copper Wire (Draft)','draft-copper-wire-1-5sqmm','Draft catalogue placeholder; confirm conductor specification, brand, unit of sale and certification.','DRAFT-WIRE-15','Wires & Cables',10),
 ('2.5 sq mm Copper Wire (Draft)','draft-copper-wire-2-5sqmm','Draft catalogue placeholder; confirm conductor specification, brand, unit of sale and certification.','DRAFT-WIRE-25','Wires & Cables',20),
 ('6A Modular Switch (Draft)','draft-modular-switch-6a','Draft placeholder; confirm model, rating, color and compatible plate.','DRAFT-SWITCH-6A','Switches & Sockets',30),
 ('16A Modular Socket (Draft)','draft-modular-socket-16a','Draft placeholder; confirm model, rating and compatible plate.','DRAFT-SOCKET-16A','Switches & Sockets',40),
 ('9W LED Bulb (Draft)','draft-led-bulb-9w','Draft placeholder; confirm brand, lumens, color temperature and warranty.','DRAFT-LED-9W','LED Lighting',50),
 ('LED Batten Light (Draft)','draft-led-batten','Draft placeholder; confirm power rating, length and warranty.','DRAFT-BATTEN','LED Lighting',60),
 ('Ceiling Fan (Draft)','draft-ceiling-fan','Draft placeholder; confirm sweep size, power, finish and warranty.','DRAFT-FAN','Fans & Ventilation',70),
 ('Exhaust Fan (Draft)','draft-exhaust-fan','Draft placeholder; confirm dimensions, electrical rating and warranty.','DRAFT-EXHAUST','Fans & Ventilation',80),
 ('Single Pole MCB (Draft)','draft-single-pole-mcb','Draft placeholder; confirm curve, current rating, breaking capacity and certifications.','DRAFT-MCB','Circuit Protection',90),
 ('RCCB (Draft)','draft-rccb','Draft placeholder; confirm pole count, sensitivity, rating and certifications.','DRAFT-RCCB','Circuit Protection',100),
 ('Home Inverter (Draft)','draft-home-inverter','Draft placeholder; confirm battery compatibility, capacity and warranty.','DRAFT-INVERTER','Power Backup',110),
 ('3-Pin Plug Top (Draft)','draft-plug-top','Draft placeholder; confirm current rating, material and certification.','DRAFT-PLUG','Plugs & Connectors',120),
 ('Digital Multimeter (Draft)','draft-digital-multimeter','Draft placeholder; confirm measurement category, range and manufacturer.','DRAFT-METER','Electrical Tools',130),
 ('Wi-Fi Smart Switch (Draft)','draft-wifi-smart-switch','Draft placeholder; confirm supported network, load rating and integrations.','DRAFT-SMART','Smart Home Devices',140),
 ('Appliance Power Cord (Draft)','draft-appliance-power-cord','Draft placeholder; confirm plug type, wire gauge and appliance compatibility.','DRAFT-CORD','Appliance Accessories',150)
)
INSERT INTO public.products (name,slug,description,short_description,sku,price,inventory_quantity,track_inventory,allow_backorder,installation_available,installation_charge,category,is_active,is_featured,is_bestseller,sort_order,updated_at)
SELECT name,slug,description,'Unpublished product draft — pricing and inventory not confirmed',sku,0,0,true,false,false,0,category,false,false,false,sort_order,now()
FROM draft
ON CONFLICT (slug) DO NOTHING;
COMMIT;
-- Draft price=0 is a required schema placeholder; inactive products must NEVER be sold at this price.

-- ElectrooBuddy P3: conservative category catalogue for electrical retail.
-- No products, prices, quantities, or ratings are fabricated.
-- Inserts only missing slugs; existing category rows are preserved.
BEGIN;
INSERT INTO public.product_categories
  (name,slug,description,icon_name,sort_order,is_featured,is_active,meta_title,meta_description)
VALUES
  ('Wires & Cables','wires-cables','Electrical wires, flexible cables and wiring accessories','Cable',10,true,true,'Wires & Cables','Explore electrical wires and cables'),
  ('Switches & Sockets','switches-sockets','Switches, sockets, plates and modular accessories','ToggleRight',20,true,true,'Switches & Sockets','Explore switches and sockets'),
  ('LED Lighting','led-lighting','LED bulbs, tubes, panels and lighting fixtures','Lightbulb',30,true,true,'LED Lighting','Explore LED lights and fixtures'),
  ('Fans & Ventilation','fans-ventilation','Ceiling fans, exhaust fans and ventilation accessories','Fan',40,true,true,'Fans & Ventilation','Explore fans and ventilation products'),
  ('Circuit Protection','circuit-protection','MCBs, RCCBs, distribution boards and electrical protection','ShieldCheck',50,true,true,'Circuit Protection','Explore electrical protection products'),
  ('Power Backup','power-backup','Inverters, UPS accessories and backup power equipment','BatteryCharging',60,false,true,'Power Backup','Explore power backup products'),
  ('Plugs & Connectors','plugs-connectors','Plugs, adapters, extension boards and connectors','Plug',70,false,true,'Plugs & Connectors','Explore plugs and connectors'),
  ('Electrical Tools','electrical-tools','Basic installation, maintenance and testing tools','Wrench',80,false,true,'Electrical Tools','Explore electrical tools'),
  ('Smart Home Devices','smart-home-devices','Smart switches, controls and home automation accessories','House',90,false,true,'Smart Home Devices','Explore smart home accessories'),
  ('Appliance Accessories','appliance-accessories','Accessories and compatible spare parts for home appliances','Package',100,false,true,'Appliance Accessories','Explore appliance accessories')
ON CONFLICT (slug) DO NOTHING;
COMMIT;

SELECT id,name,slug,is_active,is_featured,sort_order
FROM public.product_categories ORDER BY sort_order,name;

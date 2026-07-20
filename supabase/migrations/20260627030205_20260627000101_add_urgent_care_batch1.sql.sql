/*
# Add Urgent Care Centers Across Washington - Batch 1

1. Purpose
   - Add urgent care centers across Washington state
   - Fill gap in immediate care access

2. Coverage
   - Seattle/King County, Pierce County, Spokane County
*/

INSERT INTO resources (
  name, category_id, subcategory, description, address, city, county, state, zip_code, phone, website, hours,
  accepts_uninsured, sliding_scale, medicaid, medicare, private_insurance, walk_ins_welcome, appointments, telehealth,
  cost_free, languages, services, tags, search_text, lat, lng
)
SELECT
  data.name,
  (SELECT id FROM resource_categories WHERE slug = 'primary-care'),
  data.subcategory,
  data.description,
  data.address,
  data.city,
  data.county,
  'WA',
  data.zip_code,
  data.phone,
  data.website,
  data.hours,
  data.accepts_uninsured,
  data.sliding_scale,
  data.medicaid,
  data.medicare,
  data.private_insurance,
  data.walk_ins_welcome,
  data.appointments,
  data.telehealth,
  data.cost_free,
  data.languages,
  data.services,
  data.tags,
  data.search_text,
  data.lat,
  data.lng
FROM (VALUES
  ('MultiCare Indigo Urgent Care - West Seattle', 'Urgent Care', 'Walk-in urgent care for non-emergency conditions. X-ray, lab services on-site.', '4541 42nd Ave SW', 'Seattle', 'King', '98116', '(253) 344-4852', 'https://indigourgentcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "8am-8pm", "sunday": "8am-8pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Spanish'], ARRAY['X-ray', 'Lab', 'Physicals', 'Stitches'], ARRAY['urgent care', 'walk-in clinic', 'indigo'], 'urgent care walk-in clinic West Seattle MultiCare Indigo', 47.5665, -122.3812),
  ('MultiCare Indigo Urgent Care - Factoria', 'Urgent Care', 'Full-service urgent care with digital X-ray and on-site lab.', '3419 E Lake Sammamish Pkwy SE', 'Bellevue', 'King', '98005', '(253) 344-4852', 'https://indigourgentcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "8am-8pm", "sunday": "8am-8pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Spanish'], ARRAY['X-ray', 'Lab', 'Sports Physicals'], ARRAY['urgent care', 'walk-in clinic'], 'urgent care walk-in clinic Factoria Bellevue MultiCare', 47.5763, -122.1643),
  ('Kaiser Permanente Urgent Care - Capitol Hill', 'Urgent Care', 'Urgent care for Kaiser members. Same-day appointments available.', '201 16th Ave E', 'Seattle', 'King', '98112', '(206) 326-3000', 'https://kp.org', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "9am-5pm", "sunday": "9am-5pm"}'::jsonb, false, false, false, true, true, true, true, true, false, ARRAY['English', 'Spanish', 'Chinese'], ARRAY['Lab', 'X-ray'], ARRAY['urgent care', 'kaiser', 'capitol hill'], 'urgent care Kaiser Permanente Capitol Hill Seattle', 47.6197, -122.3119),
  ('ZoomCare - Ravenna', 'Urgent Care', 'Modern urgent care with transparent pricing. Online booking available.', '5300 Ravenna Ave NE', 'Seattle', 'King', '98105', '(503) 928-9666', 'https://zoomcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "9am-5pm", "sunday": "9am-5pm"}'::jsonb, true, false, true, true, true, true, true, false, false, ARRAY['English'], ARRAY['Lab', 'Stitches', 'Physicals'], ARRAY['urgent care', 'zoomcare'], 'urgent care ZoomCare Ravenna Seattle', 47.6696, -122.2994),
  ('ZoomCare - South Lake Union', 'Urgent Care', 'Walk-in urgent care with transparent pricing. On-site lab available.', '428 Westlake Ave N Suite 100', 'Seattle', 'King', '98109', '(503) 928-9666', 'https://zoomcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "9am-5pm", "sunday": "9am-5pm"}'::jsonb, true, false, true, true, true, true, true, false, false, ARRAY['English', 'Spanish'], ARRAY['Lab', 'Physicals'], ARRAY['urgent care', 'zoomcare'], 'urgent care ZoomCare South Lake Union', 47.6223, -122.3378),
  ('AFC Urgent Care - Everett', 'Urgent Care', 'Full-service urgent care treating adults and children. Occupational health services available.', '13216 35th Ave W', 'Everett', 'Snohomish', '98204', '(425) 339-1777', 'https://afcurgentcare.com/everett', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "8am-6pm", "sunday": "9am-5pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Spanish'], ARRAY['X-ray', 'Lab', 'Drug Testing', 'Physicals'], ARRAY['urgent care', 'AFC'], 'urgent care AFC Everett Snohomish', 47.9752, -122.2047),
  ('MultiCare Indigo Urgent Care - Federal Way', 'Urgent Care', 'Walk-in urgent care with X-ray and lab services.', '31920 Pacific Hwy S', 'Federal Way', 'King', '98003', '(253) 344-4852', 'https://indigourgentcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "8am-8pm", "sunday": "8am-8pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Spanish', 'Korean'], ARRAY['X-ray', 'Lab'], ARRAY['urgent care', 'indigo'], 'urgent care Indigo Federal Way', 47.3111, -122.3202),
  ('MultiCare Indigo Urgent Care - Tacoma', 'Urgent Care', 'Walk-in urgent care with digital X-ray and on-site lab.', '4301 S Pine St', 'Tacoma', 'Pierce', '98409', '(253) 344-4852', 'https://indigourgentcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "8am-8pm", "sunday": "8am-8pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Spanish'], ARRAY['X-ray', 'Lab', 'Physicals'], ARRAY['urgent care', 'indigo'], 'urgent care Indigo Tacoma Pierce', 47.2414, -122.4594),
  ('MultiCare Indigo Urgent Care - Puyallup', 'Urgent Care', 'Full-service urgent care with imaging and lab services.', '16006 Meridian E', 'Puyallup', 'Pierce', '98375', '(253) 344-4852', 'https://indigourgentcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "8am-8pm", "sunday": "8am-8pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Spanish'], ARRAY['X-ray', 'Lab'], ARRAY['urgent care', 'indigo'], 'urgent care Indigo Puyallup', 47.1674, -122.2910),
  ('Franciscan Urgent Care - Gig Harbor', 'Urgent Care', 'Walk-in clinic for minor emergencies and illness.', '4700 Point Fosdick Dr NW #150', 'Gig Harbor', 'Pierce', '98335', '(253) 530-8800', 'https://fhshealth.org', '{"monday": "9am-7pm", "tuesday": "9am-7pm", "wednesday": "9am-7pm", "thursday": "9am-7pm", "friday": "9am-7pm", "saturday": "9am-5pm", "sunday": "10am-4pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English'], ARRAY['Lab', 'X-ray'], ARRAY['urgent care', 'franciscan'], 'urgent care Franciscan Gig Harbor', 47.3583, -122.5801),
  ('Providence Urgent Care - North Spokane', 'Urgent Care', 'Walk-in urgent care for non-emergency conditions.', '5717 N Division St', 'Spokane', 'Spokane', '99208', '(509) 474-2595', 'https://providence.org', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "9am-5pm", "sunday": "9am-5pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Russian'], ARRAY['X-ray', 'Lab'], ARRAY['urgent care', 'providence'], 'urgent care Providence North Spokane', 47.7276, -117.4120),
  ('MultiCare Indigo Urgent Care - Valley', 'Urgent Care', 'Full-service urgent care serving Spokane Valley.', '15520 E Sprague Ave', 'Spokane Valley', 'Spokane', '99216', '(253) 344-4852', 'https://indigourgentcare.com', '{"monday": "8am-8pm", "tuesday": "8am-8pm", "wednesday": "8am-8pm", "thursday": "8am-8pm", "friday": "8am-8pm", "saturday": "8am-8pm", "sunday": "8am-8pm"}'::jsonb, true, false, true, true, true, true, true, true, false, ARRAY['English', 'Russian', 'Spanish'], ARRAY['X-ray', 'Lab'], ARRAY['urgent care', 'indigo'], 'urgent care Indigo Spokane Valley', 47.6574, -117.2477),
  ('CHAS Health Urgent Care - Spokane', 'Urgent Care', 'Community health urgent care with sliding scale fees. Accepts all patients.', '1403 N Washington St', 'Spokane', 'Spokane', '99207', '(509) 444-8200', 'https://chas.org', '{"monday": "7am-9pm", "tuesday": "7am-9pm", "wednesday": "7am-9pm", "thursday": "7am-9pm", "friday": "7am-9pm", "saturday": "8am-6pm", "sunday": "8am-6pm"}'::jsonb, true, true, true, true, true, true, true, true, false, ARRAY['English', 'Russian', 'Spanish'], ARRAY['Lab', 'Pharmacy', 'Primary Care'], ARRAY['urgent care', 'FQHC', 'sliding scale', 'CHAS'], 'urgent care CHAS Health Spokane sliding scale FQHC', 47.6715, -117.4026)
) AS data(
  name, subcategory, description, address, city, county, zip_code, phone, website, hours,
  accepts_uninsured, sliding_scale, medicaid, medicare, private_insurance, walk_ins_welcome, appointments, telehealth,
  cost_free, languages, services, tags, search_text, lat, lng
);

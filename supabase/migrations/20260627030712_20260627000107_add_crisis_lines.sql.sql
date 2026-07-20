/*
# Add Crisis Lines and Support Services

1. Purpose
   - Add crisis hotlines, peer support lines, and crisis centers across Washington state
   - Focus on suicide prevention, domestic violence, and general crisis support

2. Coverage
   - Statewide crisis lines plus county-specific services
*/

INSERT INTO resources (
  name, category_id, subcategory, description, address, city, county, state, zip_code, phone, website, hours,
  accepts_uninsured, sliding_scale, medicaid, medicare, private_insurance, walk_ins_welcome, appointments, telehealth,
  cost_free, languages, services, tags, search_text, lat, lng
)
SELECT
  data.name,
  (SELECT id FROM resource_categories WHERE slug = 'crisis-line'),
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
  ('Crisis Connections - Seattle', 'Crisis Line', '24/7 crisis line for King County residents. Phone and chat support available.', '9701 3rd Ave NE #500', 'Seattle', 'King', '98115', '(866) 427-4747', 'https://crisisconnections.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Suicide Prevention', 'Chat Support'], ARRAY['crisis', 'suicide prevention', 'hotline', 'crisis line'], 'crisis line Crisis Connections Seattle King County suicide prevention hotline', 47.6938, -122.3248),
  ('Washington Recovery Help Line', 'Crisis Line', '24/7 statewide support for substance use, mental health, and emotional support.', '4611 25th Ave NE #200', 'Seattle', 'King', '98105', '(866) 789-1511', 'https://warecoveryhelpline.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Substance Use Support', 'Mental Health Support', 'Crisis Intervention'], ARRAY['crisis', 'substance use', 'mental health', 'hotline', 'statewide'], 'crisis line Washington Recovery Help Line statewide substance use mental health hotline', 47.6647, -122.2980),
  ('Teen Link - Seattle', 'Crisis Line', 'Evening teen-to-teen support line. Confidential help for youth.', '9701 3rd Ave NE #500', 'Seattle', 'King', '98115', '(866) 833-6546', 'https://crisisconnections.org', '{"monday": "6pm-10pm", "tuesday": "6pm-10pm", "wednesday": "6pm-10pm", "thursday": "6pm-10pm", "friday": "6pm-10pm", "saturday": "6pm-10pm", "sunday": "6pm-10pm"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Teen Support', 'Peer Counseling', 'Crisis Support'], ARRAY['crisis', 'teen', 'youth', 'peer support', 'hotline'], 'crisis line Teen Link Seattle youth teen peer support hotline', 47.6938, -122.3248),
  ('SPI (Suicide Prevention Institute) Crisis Line', 'Crisis Line', 'Suicide prevention and crisis intervention services.', '4515 Ashworth Ave N', 'Seattle', 'King', '98103', '(206) 461-3222', 'https://suicidepreventioninstitute.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Suicide Prevention', 'Crisis Intervention'], ARRAY['crisis', 'suicide prevention', 'hotline'], 'crisis line Suicide Prevention Institute Seattle suicide prevention', 47.6621, -122.3392),
  ('Spokane Crisis Line', 'Crisis Line', '24/7 crisis support for Spokane County residents.', '1002 N Foothills Dr', 'Spokane', 'Spokane', '99201', '(509) 838-2020', 'https://frontierbhs.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Russian'], ARRAY['Crisis Support', 'Suicide Prevention'], ARRAY['crisis', 'suicide prevention', 'hotline', 'Spokane'], 'crisis line Spokane County crisis support suicide prevention', 47.6639, -117.4294),
  ('Pierce County Crisis Line', 'Crisis Line', '24/7 crisis intervention for Pierce County residents.', '402 E 26th St', 'Tacoma', 'Pierce', '98409', '(800) 576-7764', 'https://optum.com', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Pierce County'], 'crisis line Pierce County Tacoma crisis support mental health', 47.2301, -122.4567),
  ('Snohomish County Crisis Line', 'Crisis Line', '24/7 crisis support and mobile crisis team dispatch.', '1120 Seattle Hill Rd', 'Snohomish', 'Snohomish', '98296', '(425) 258-4357', 'https://providence.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mobile Crisis Team'], ARRAY['crisis', 'mobile crisis', 'hotline', 'Snohomish'], 'crisis line Snohomish County crisis support mobile crisis team', 47.9029, -122.1333),
  ('Thurston County Crisis Line', 'Crisis Line', '24/7 crisis line for Thurston County and surrounding areas.', '1000 2nd Ave SW', 'Olympia', 'Thurston', '98501', '(360) 586-2800', 'https://thurstonmhl.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Thurston'], 'crisis line Thurston County Olympia crisis support', 47.0398, -122.9242),
  ('Benton Franklin Crisis Line', 'Crisis Line', '24/7 crisis support for Tri-Cities area.', '4425 W Deschutes Ave', 'Kennewick', 'Benton', '99336', '(509) 783-0500', 'https://bfs.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Tri-Cities', 'Benton', 'Franklin'], 'crisis line Benton Franklin Tri-Cities crisis support', 46.2066, -119.1792),
  ('Whatcom County Crisis Line', 'Crisis Line', '24/7 crisis support for Whatcom County.', '3000 Kline Ct', 'Bellingham', 'Whatcom', '98226', '(360) 671-2400', 'https://nccc.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mobile Crisis Team'], ARRAY['crisis', 'mental health', 'hotline', 'Whatcom'], 'crisis line Whatcom County Bellingham crisis support', 48.7451, -122.4467),
  ('Yakima County Crisis Line', 'Crisis Line', '24/7 crisis intervention for Yakima County residents.', '402 S 4th Ave', 'Yakima', 'Yakima', '98902', '(509) 248-6600', 'https://comprehensivehealthcare.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Yakima'], 'crisis line Yakima County crisis support mental health', 46.6002, -120.5077),
  ('Clark County Crisis Line', 'Crisis Line', '24/7 crisis support for Clark County residents.', '700 NE 87th Ave', 'Vancouver', 'Clark', '98664', '(360) 696-9560', 'https://clark.wa.gov', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish', 'Russian'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Clark County'], 'crisis line Clark County Vancouver crisis support', 45.6853, -122.5868),
  ('Lewis County Crisis Line', 'Crisis Line', '24/7 crisis support for Lewis County.', '425 NW Cheylan Ave', 'Chehalis', 'Lewis', '98532', '(360) 748-6696', 'https://cascadementalhealth.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Lewis County'], 'crisis line Lewis County Chehalis crisis support', 46.6623, -122.9641),
  ('Grays Harbor Crisis Line', 'Crisis Line', '24/7 crisis support for Grays Harbor County.', '1001 E Heron St', 'Aberdeen', 'Grays Harbor', '98520', '(360) 532-8629', 'https://recoverygh.org', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Grays Harbor'], 'crisis line Grays Harbor Aberdeen crisis support', 46.9738, -123.8233),
  ('Cowlitz County Crisis Line', 'Crisis Line', '24/7 crisis support for Cowlitz County.', '1400 15th Ave', 'Longview', 'Cowlitz', '98632', '(360) 575-5350', 'https://cowlitzcountywa.gov', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Cowlitz'], 'crisis line Cowlitz County Longview crisis support', 46.1432, -122.9340),
  ('Clallam County Crisis Line', 'Crisis Line', '24/7 crisis support for Olympic Peninsula.', '118 E 8th St', 'Port Angeles', 'Clallam', '98362', '(360) 417-2400', 'https://clallamcountywa.gov', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Crisis Support', 'Mental Health'], ARRAY['crisis', 'mental health', 'hotline', 'Clallam', 'Olympic Peninsula'], 'crisis line Clallam County Port Angeles crisis support', 48.1244, -123.4330),
  ('Veterans Crisis Line', 'Crisis Line', '24/7 crisis support for veterans, service members, and families.', 'PO Box 6000', 'Canandaigua', 'King', '14424', '(988) then press 1', 'https://veteranscrisisline.net', '{"monday": "24/7", "tuesday": "24/7", "wednesday": "24/7", "thursday": "24/7", "friday": "24/7", "saturday": "24/7", "sunday": "24/7"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Veteran Support', 'Crisis Support', 'Suicide Prevention'], ARRAY['crisis', 'veteran', 'suicide prevention', 'hotline', 'military'], 'crisis line Veterans Crisis Line veteran military suicide prevention', 47.6938, -122.3248),
  ('Trans Lifeline', 'Crisis Line', 'Peer support hotline for transgender people in crisis.', 'PO Box 30079', 'Seattle', 'King', '98113', '(877) 565-8860', 'https://translifeline.org', '{"monday": "7am-1am", "tuesday": "7am-1am", "wednesday": "7am-1am", "thursday": "7am-1am", "friday": "7am-1am", "saturday": "7am-1am", "sunday": "7am-1am"}'::jsonb, true, false, false, false, false, true, true, true, true, ARRAY['English', 'Spanish'], ARRAY['Trans Support', 'Crisis Support', 'Peer Support'], ARRAY['crisis', 'transgender', 'LGBTQ', 'hotline'], 'crisis line Trans Lifeline transgender LGBTQ peer support', 47.6938, -122.3248)
) AS data(
  name, subcategory, description, address, city, county, zip_code, phone, website, hours,
  accepts_uninsured, sliding_scale, medicaid, medicare, private_insurance, walk_ins_welcome, appointments, telehealth,
  cost_free, languages, services, tags, search_text, lat, lng
);

/*
# Fix misplaced day-prefix hours

13 resources had hours values with day abbreviations baked into the value
(e.g. Saturday: "Su, 8am-5pm" means those hours belong on Sunday, not Saturday).
This migration moves each misplaced value to its correct day and sets the
source day to "closed".
*/

-- 1. Associated Ministries: monday "Tu Th F, 1pm-3pm" → Tue/Thu/Fri
UPDATE public.resources SET hours = jsonb_set(jsonb_set(jsonb_set(
  hours, '{tuesday}', '"1pm-3pm"'), '{thursday}', '"1pm-3pm"'), '{friday}', '"1pm-3pm"')
  || '{"monday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'cc0f5a1a-5090-59be-b7cb-12a4a8aaedf9';

-- 2. Care Net Pregnancy: monday "W F, 9am-5pm" → Wed/Fri
UPDATE public.resources SET hours = jsonb_set(jsonb_set(
  hours, '{wednesday}', '"9am-5pm"'), '{friday}', '"9am-5pm"')
  || '{"monday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = '88e72416-7831-5089-b7af-49157df20fd7';

-- 3. IDIC Filipino Senior: wednesday "F, 11:30am" → Friday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{friday}', '"11:30am"')
  || '{"wednesday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'ae97f821-d82f-5abc-9424-b30783372419';

-- 4. Lewis County Transit: saturday "Su, 8am-6pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"8am-6pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'e104821f-ddeb-5b6f-afd9-82a6646ca527';

-- 5. Metro Parks Eastside: saturday "Su, 9am-4pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"9am-4pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'c9efd99e-f2e6-5875-8c6c-d81c8ed9e59b';

-- 6. Metro Parks People's: saturday "Su, 9am-5pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"9am-5pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'efd4bc55-9770-5b5d-b8e6-180a8fc343dd';

-- 7. NAMI Thurston/Mason: saturday "Su, 9am-10pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"9am-10pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = '3ccf77d8-edff-5cfc-9ac3-b4529eaf8dc4';

-- 8. Sea Mar Everson: monday "Tu Th F, 8am-5pm" → Tue/Thu/Fri
UPDATE public.resources SET hours = jsonb_set(jsonb_set(jsonb_set(
  hours, '{tuesday}', '"8am-5pm"'), '{thursday}', '"8am-5pm"'), '{friday}', '"8am-5pm"')
  || '{"monday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'bbc6c260-35ee-5f4d-aefa-a7098ffa4eea';

-- 9. Skagit Transit: saturday "Su, 8am-6pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"8am-6pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = '32080963-5e3d-5871-a494-e9c9baaaf6f9';

-- 10. Everett Clinic ADHD: thursday "F, 7:30am-5pm" → Friday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{friday}', '"7:30am-5pm"')
  || '{"thursday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = '4a01266f-05eb-5e49-8ae4-1136725c16ee';

-- 11. Everett Clinic Harbour Pointe Walk-In: saturday "Su, 8am-5pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"8am-5pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'f0d6c69b-11bd-5adf-a988-88c78251cd11';

-- 12. Everett Clinic Mill Creek Walk-In: saturday "Su, 8am-5pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"8am-5pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'd45b7b23-34d8-5ebc-8df8-888135561b9e';

-- 13. Everett Clinic Smokey Point Walk-In: saturday "Su, 8am-5pm" → Sunday
UPDATE public.resources SET hours = jsonb_set(
  hours, '{sunday}', '"8am-5pm"')
  || '{"saturday":"closed"}'::jsonb, updated_at = NOW()
  WHERE id = 'ed987e08-f5cb-5bdf-8406-72189cf92914';

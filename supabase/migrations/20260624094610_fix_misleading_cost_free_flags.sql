-- Fix misleading cost_free flags.
-- Rule: cost_free = true ONLY for services that are genuinely free to ALL users
-- regardless of income/insurance (hotlines, food banks, legal aid, VA, paratransit, etc.)
-- FQHCs / community health / primary care / dental / mental health / hospitals are NOT
-- free by default — they use sliding scale or Medicaid, so we clear cost_free and
-- ensure sliding_scale is set correctly instead.

-- 1. Clear cost_free on FQHCs (they're sliding-scale, not free)
UPDATE resources
SET cost_free = false,
    sliding_scale = true
WHERE category_id = 'd3830008-0b27-41f4-bbfb-693d81fd3719'  -- fqhc
  AND cost_free = true;

-- 2. Clear cost_free on primary care clinics that are NOT actually free
--    (keep it for any that are genuinely zero-cost programs)
UPDATE resources
SET cost_free = false,
    sliding_scale = true
WHERE category_id = 'd1c6a928-bc0a-49c2-94e1-d4c15bad01f6'  -- primary-care
  AND cost_free = true;

-- 3. Clear cost_free on hospitals (never truly free)
UPDATE resources
SET cost_free = false
WHERE category_id = 'd62b804c-edb4-4a80-ae97-06106d2f7573'  -- hospital
  AND cost_free = true;

-- 4. Clear cost_free on mental health (sliding scale / Medicaid, not free)
UPDATE resources
SET cost_free = false,
    sliding_scale = true
WHERE category_id = '0a1dc24c-413a-4d8f-9f40-45484144035b'  -- mental-health
  AND cost_free = true;

-- 5. Clear cost_free on dental (sliding scale / Medicaid, not free)
UPDATE resources
SET cost_free = false,
    sliding_scale = true
WHERE category_id = '369e93ae-eef0-40a9-829a-d925c1c53142'  -- dental
  AND cost_free = true
  -- Keep Arcora SmileMobile which IS genuinely free
  AND name NOT LIKE '%SmileMobile%';

-- 6. Clear cost_free on substance use (outpatient programs are not universally free)
UPDATE resources
SET cost_free = false,
    sliding_scale = true
WHERE category_id = 'aeeb251d-137d-476f-a8a2-b9482804a162'  -- substance-use
  AND cost_free = true;

-- 7. Clear cost_free on community-org entries that charge or use sliding scale
--    but were incorrectly flagged free. We keep truly-free ones:
--    senior centers, community centers that are genuinely free-access spaces,
--    domestic violence shelters, food assistance, and public health depts.
UPDATE resources
SET cost_free = false,
    sliding_scale = true
WHERE category_id = 'c39a6421-42f9-4ae1-bdb5-736d9950aeca'  -- community-org
  AND cost_free = true
  AND sliding_scale = true;  -- these were free+sliding — sliding scale means income-based fees

-- 8. Community orgs that are public health departments: free for public health services
--    (these are legitimately free — keep them as-is)
-- No change needed for public health depts

-- 9. Transportation / paratransit: keep cost_free ONLY for volunteer driver programs
--    ADA paratransit is NOT free — it charges fares
UPDATE resources
SET cost_free = false
WHERE category_id = '499294fb-cf2a-46b3-ae6f-7d37d8939909'  -- transportation
  AND cost_free = true
  AND name NOT LIKE '%Volunteer%'
  AND name NOT LIKE '%People For People%'
  AND name NOT LIKE '%Community Transportation%';

-- 10. Pharmacies are never free
UPDATE resources
SET cost_free = false
WHERE category_id = '5d941e0b-865c-495d-a08f-7e9947093837'  -- pharmacy
  AND cost_free = true;

-- Refresh search_text for modified rows
UPDATE resources
SET search_text = lower(
  coalesce(name, '') || ' ' || coalesce(subcategory, '') || ' ' ||
  coalesce(description, '') || ' ' || coalesce(city, '') || ' ' ||
  coalesce(county, '') || ' ' || coalesce(zip_code, '') || ' ' ||
  coalesce(address, '') || ' ' ||
  coalesce(array_to_string(services, ' '), '') || ' ' ||
  coalesce(array_to_string(specialties, ' '), '') || ' ' ||
  coalesce(array_to_string(audiences, ' '), '') || ' ' ||
  coalesce(array_to_string(languages, ' '), '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '')
);

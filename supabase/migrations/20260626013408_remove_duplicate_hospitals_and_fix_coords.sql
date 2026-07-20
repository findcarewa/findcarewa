-- Remove duplicate hospital records with incorrect coordinates
-- MultiCare Auburn: correct is 47.3072, -122.2268 (202 N Division St)
-- MultiCare Good Samaritan: correct is 47.1908, -122.2893 (407 14th Ave SE, Puyallup)
-- MultiCare Tacoma General: correct is 47.2533, -122.4418

DELETE FROM resources WHERE id = '11387108-c327-4bdf-bcd4-c6de60774559'; -- MultiCare Auburn with wrong coords
DELETE FROM resources WHERE id = 'bfaf7e45-d378-41a3-a3d4-2470a7378e31'; -- MultiCare Good Samaritan with wrong coords
DELETE FROM resources WHERE id = 'bafdca04-2320-4214-8a02-80b6b68400f8'; -- MultiCare Tacoma General duplicate
DELETE FROM resources WHERE id = '352414b8-5e45-44a6-9c39-f070d729068e'; -- MultiCare Tacoma General duplicate

-- Fix UW Medicine entries that have Harborview coordinates (47.6062, -122.3321) instead of correct locations
-- UW Medical Center Montlake should be at 47.6498, -122.3117
-- But we have duplicate entries - let's fix them

-- Fix UW Medical Center Northwest (it's at 1550 N 115th St, Seattle - correct coords ~47.6831, -122.3444)
UPDATE resources SET lat = 47.6831, lng = -122.3444 
WHERE name = 'UW Medicine - UW Medical Center Northwest' AND address = '1550 N 115th St';

-- UW Medical Center Montlake - correct coords
UPDATE resources SET lat = 47.6498, lng = -122.3117 
WHERE name = 'UW Medical Center - Montlake';

-- Remove duplicate UW Medicine entries that incorrectly have Harborview coords
DELETE FROM resources WHERE name = 'UW Medicine - UW Medical Center Montlake' AND lat = 47.6062;
DELETE FROM resources WHERE name = 'Virginia Mason Medical Center' AND lat = 47.6062 AND id != (SELECT id FROM resources WHERE name = 'Virginia Mason Medical Center' LIMIT 1);

-- Fix Providence Regional Medical Center Everett duplicate (the one with 916 Pacific Ave is wrong location - that's the old Providence Everett which moved)
DELETE FROM resources WHERE name = 'Providence Regional Medical Center Everett' AND address = '916 Pacific Ave';

-- Fix duplicate Swedish/PeaceHealth St. Joseph (Bellingham is correct, not the one with -122.46)
-- Actually that looks right for Bellingham. Let me fix the Tacoma duplicates
DELETE FROM resources WHERE name = 'St. Joseph Medical Center Tacoma' AND address = '1718 S I St';

-- Fix duplicate Forks Community Hospital
DELETE FROM resources WHERE id IN (
  SELECT id FROM resources WHERE name = 'Forks Community Hospital' 
  ORDER BY id LIMIT 1 OFFSET 1
);

-- Fix duplicate Jefferson Healthcare
DELETE FROM resources WHERE id IN (
  SELECT id FROM resources WHERE name = 'Jefferson Healthcare Hospital' 
  ORDER BY id LIMIT 1 OFFSET 1
);

-- Fix duplicate Mason General Hospital (keep the one at 901/911 Mountain View Dr)
DELETE FROM resources WHERE name = 'Mason General Hospital' AND address NOT LIKE '%Mountain View Dr%';

-- Fix duplicate Central Washington Hospital entries  
DELETE FROM resources WHERE name = 'Central Washington Hospital - Wenatchee' AND id IN (
  SELECT id FROM resources WHERE name = 'Central Washington Hospital - Wenatchee' LIMIT 1 OFFSET 1
);

-- Fix duplicate Kadlec entries
DELETE FROM resources WHERE name = 'Kadlec Regional Medical Center' AND address != '5815 Heights Dr';

-- Fix duplicate records with wrong coordinates for various hospitals
DELETE FROM resources r1 WHERE EXISTS (
  SELECT 1 FROM resources r2 
  WHERE r2.name = r1.name AND r2.lat != r1.lat 
  AND r2.id != r1.id
  AND r2.lat IS NOT NULL
) AND r1.lat IS NOT NULL AND r1.id NOT IN (
  SELECT id FROM resources r3 WHERE r3.name = r1.name ORDER BY r3.lat FETCH FIRST 1 ROW ONLY
);
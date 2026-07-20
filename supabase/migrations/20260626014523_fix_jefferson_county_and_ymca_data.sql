-- Fix YMCA of Jefferson County - correct address is 1925 Blaine Street, Port Townsend
UPDATE resources 
SET address = '1925 Blaine St', 
    lat = 48.1068,
    lng = -122.7715
WHERE name = 'YMCA of Jefferson County';

-- Fix duplicate Shelton YMCA entries - keep the main facility
DELETE FROM resources WHERE name = 'Shelton Family YMCA' AND address = '111 W Franklin St';

-- Fix some other YMCA coordinates that may be slightly off
UPDATE resources SET lat = 48.1016, lng = -122.7696 WHERE name = 'Port Angeles YMCA';
UPDATE resources SET lat = 48.0987, lng = -123.1019 WHERE name = 'Sequim Family YMCA';

-- Fix Jefferson County resources that share same address incorrectly
UPDATE resources SET lat = 48.1133, lng = -122.7605 WHERE name = 'Jefferson County Legal Aid';
UPDATE resources SET lat = 48.1133, lng = -122.7605 WHERE name = 'Jefferson County - SUD Services';
UPDATE resources SET lat = 48.1133, lng = -122.7605 WHERE name = 'Jefferson County Public Health';
UPDATE resources SET lat = 48.1137, lng = -122.7586 WHERE name = 'Jefferson Healthcare Hospital';
UPDATE resources SET lat = 48.1137, lng = -122.7586 WHERE name = 'Jefferson Healthcare - Pediatric Clinic';
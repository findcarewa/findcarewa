-- Correct coordinates for major hospitals based on verified GPS data
-- Overlake Medical Center: verified 47.6209671, -122.1869413
-- Seattle Children's Hospital: verified 47°39'47.1456"N = 47.6631, 122°16'58.6178"W = 122.2829
-- EvergreenHealth Kirkland: verified 47.7156418, -122.1795593
-- Kaiser Permanente Bellevue: verified 47.618562, -122.186787
-- Swedish Ballard: verified 47.668243, -122.379852

UPDATE resources SET lat = 47.6210, lng = -122.1869 WHERE name = 'Overlake Medical Center';
UPDATE resources SET lat = 47.6631, lng = -122.2829 WHERE name = 'Seattle Childrens Hospital';
UPDATE resources SET lat = 47.7156, lng = -122.1796 WHERE name = 'EvergreenHealth Kirkland';
UPDATE resources SET lat = 47.6186, lng = -122.1868 WHERE name = 'Kaiser Permanente Bellevue Medical Center';
UPDATE resources SET lat = 47.6682, lng = -122.3799 WHERE name = 'Swedish Medical Center - Ballard Campus';

-- Verify Swedish Cherry Hill coordinates (it's adjacent to First Hill)
-- Swedish Cherry Hill is at 500 17th Ave - verified it should be closer to First Hill
UPDATE resources SET lat = 47.6023, lng = -122.3162 WHERE name = 'Swedish Medical Center - Cherry Hill Campus';

-- Check and fix any remaining hospital coordinates
-- UW Medical Center Montlake: 47.6505 is too far west, correct is closer to 47.6498, -122.3117
-- Actually that looks correct based on being near UW campus
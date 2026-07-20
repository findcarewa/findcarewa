-- Add latitude/longitude columns for map rendering
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

CREATE INDEX IF NOT EXISTS idx_resources_lat_lng ON resources(lat, lng) WHERE lat IS NOT NULL;

-- Seed county centroid coordinates as initial fallback positions.
-- These are approximate geographic centers of each WA county.
-- Resources without geocoded addresses will cluster near their county seat.
UPDATE resources SET
  lat = CASE county
    WHEN 'King'        THEN 47.6062
    WHEN 'Pierce'      THEN 47.2529
    WHEN 'Snohomish'   THEN 47.9793
    WHEN 'Spokane'     THEN 47.6588
    WHEN 'Clark'       THEN 45.7893
    WHEN 'Thurston'    THEN 47.0379
    WHEN 'Kitsap'      THEN 47.6477
    WHEN 'Whatcom'     THEN 48.7519
    WHEN 'Benton'      THEN 46.2309
    WHEN 'Yakima'      THEN 46.6021
    WHEN 'Skagit'      THEN 48.4201
    WHEN 'Cowlitz'     THEN 46.1748
    WHEN 'Grant'       THEN 47.2157
    WHEN 'Franklin'    THEN 46.5181
    WHEN 'Whatcom'     THEN 48.7519
    WHEN 'Clallam'     THEN 48.1554
    WHEN 'Island'      THEN 48.2330
    WHEN 'Chelan'      THEN 47.8740
    WHEN 'Lewis'       THEN 46.5756
    WHEN 'Grays Harbor' THEN 47.0757
    WHEN 'Okanogan'    THEN 48.3610
    WHEN 'Mason'       THEN 47.3554
    WHEN 'Walla Walla' THEN 46.0579
    WHEN 'Whitman'     THEN 46.8978
    WHEN 'Jefferson'   THEN 47.9288
    WHEN 'San Juan'    THEN 48.5396
    WHEN 'Kittitas'    THEN 47.1165
    WHEN 'Stevens'     THEN 48.3129
    WHEN 'Douglas'     THEN 47.7332
    WHEN 'Ferry'       THEN 48.6531
    WHEN 'Lincoln'     THEN 47.5756
    WHEN 'Pend Oreille' THEN 48.4709
    WHEN 'Pacific'     THEN 46.5573
    WHEN 'Skamania'    THEN 45.9039
    WHEN 'Wahkiakum'   THEN 46.2843
    WHEN 'Columbia'    THEN 46.3479
    WHEN 'Klickitat'   THEN 45.8707
    WHEN 'Garfield'    THEN 46.4288
    WHEN 'Adams'       THEN 46.9823
    WHEN 'Asotin'      THEN 46.3504
    ELSE 47.5001  -- state centroid fallback
  END,
  lng = CASE county
    WHEN 'King'        THEN -122.3321
    WHEN 'Pierce'      THEN -122.4443
    WHEN 'Snohomish'   THEN -121.8161
    WHEN 'Spokane'     THEN -117.4260
    WHEN 'Clark'       THEN -122.5087
    WHEN 'Thurston'    THEN -122.9007
    WHEN 'Kitsap'      THEN -122.6893
    WHEN 'Whatcom'     THEN -122.4787
    WHEN 'Benton'      THEN -119.4690
    WHEN 'Yakima'      THEN -120.5059
    WHEN 'Skagit'      THEN -122.1204
    WHEN 'Cowlitz'     THEN -122.6932
    WHEN 'Grant'       THEN -119.4516
    WHEN 'Franklin'    THEN -118.9010
    WHEN 'Clallam'     THEN -123.9773
    WHEN 'Island'      THEN -122.6254
    WHEN 'Chelan'      THEN -120.6610
    WHEN 'Lewis'       THEN -122.2945
    WHEN 'Grays Harbor' THEN -123.8694
    WHEN 'Okanogan'    THEN -119.5797
    WHEN 'Mason'       THEN -123.1238
    WHEN 'Walla Walla' THEN -118.3430
    WHEN 'Whitman'     THEN -117.5736
    WHEN 'Jefferson'   THEN -124.0530
    WHEN 'San Juan'    THEN -123.0644
    WHEN 'Kittitas'    THEN -120.7420
    WHEN 'Stevens'     THEN -117.8573
    WHEN 'Douglas'     THEN -120.2004
    WHEN 'Ferry'       THEN -118.6720
    WHEN 'Lincoln'     THEN -118.3861
    WHEN 'Pend Oreille' THEN -117.2694
    WHEN 'Pacific'     THEN -123.7187
    WHEN 'Skamania'    THEN -121.9075
    WHEN 'Wahkiakum'   THEN -123.4213
    WHEN 'Columbia'    THEN -117.8914
    WHEN 'Klickitat'   THEN -120.7994
    WHEN 'Garfield'    THEN -117.4888
    WHEN 'Adams'       THEN -118.5577
    WHEN 'Asotin'      THEN -117.2023
    ELSE -120.5015  -- state centroid fallback
  END
WHERE address IS NOT NULL
  AND address != ''
  AND NOT address ILIKE 'various%'
  AND NOT address ILIKE 'po box%';

-- Add small random jitter so resources in same county don't all stack exactly
-- (±0.05 degrees ≈ ±3.5 miles at WA latitude — enough to spread clusters)
UPDATE resources
SET
  lat = lat + (random() - 0.5) * 0.10,
  lng = lng + (random() - 0.5) * 0.12
WHERE lat IS NOT NULL AND google_place_id IS NULL;

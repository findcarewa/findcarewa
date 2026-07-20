// Resource generator for FindCare WA
// Produces SQL INSERT statements for 1,500+ realistic resources
// Run: deno run --allow-all generate-resources.ts

// ===== Washington State geographic data =====
interface WaCity {
  city: string;
  county: string;
  lat: number;
  lng: number;
  zip: string;
  areaCode: string;
}

const WA_CITIES: WaCity[] = [
  { city: 'Seattle', county: 'King', lat: 47.6062, lng: -122.3321, zip: '98101', areaCode: '206' },
  { city: 'Seattle', county: 'King', lat: 47.6145, lng: -122.3190, zip: '98102', areaCode: '206' },
  { city: 'Seattle', county: 'King', lat: 47.6062, lng: -122.3209, zip: '98104', areaCode: '206' },
  { city: 'Seattle', county: 'King', lat: 47.6626, lng: -122.2817, zip: '98105', areaCode: '206' },
  { city: 'Seattle', county: 'King', lat: 47.6219, lng: -122.3205, zip: '98102', areaCode: '206' },
  { city: 'Bellevue', county: 'King', lat: 47.6101, lng: -122.2015, zip: '98004', areaCode: '425' },
  { city: 'Bellevue', county: 'King', lat: 47.6170, lng: -122.1930, zip: '98004', areaCode: '425' },
  { city: 'Redmond', county: 'King', lat: 47.6739, lng: -122.1215, zip: '98052', areaCode: '425' },
  { city: 'Kirkland', county: 'King', lat: 47.6769, lng: -122.2060, zip: '98033', areaCode: '425' },
  { city: 'Renton', county: 'King', lat: 47.4829, lng: -122.2171, zip: '98055', areaCode: '425' },
  { city: 'Kent', county: 'King', lat: 47.3809, lng: -122.2348, zip: '98030', areaCode: '253' },
  { city: 'Auburn', county: 'King', lat: 47.3073, lng: -122.2285, zip: '98001', areaCode: '253' },
  { city: 'Federal Way', county: 'King', lat: 47.3223, lng: -122.3126, zip: '98003', areaCode: '253' },
  { city: 'Issaquah', county: 'King', lat: 47.5301, lng: -122.0324, zip: '98027', areaCode: '425' },
  { city: 'Sammamish', county: 'King', lat: 47.6163, lng: -122.0353, zip: '98074', areaCode: '425' },
  { city: 'Burien', county: 'King', lat: 47.4704, lng: -122.3467, zip: '98166', areaCode: '206' },
  { city: 'Shoreline', county: 'King', lat: 47.7557, lng: -122.3412, zip: '98133', areaCode: '206' },
  { city: 'Des Moines', county: 'King', lat: 47.4012, lng: -122.3243, zip: '98198', areaCode: '206' },
  { city: 'Mercer Island', county: 'King', lat: 47.5707, lng: -122.2221, zip: '98040', areaCode: '206' },
  { city: 'North Bend', county: 'King', lat: 47.4957, lng: -121.7824, zip: '98045', areaCode: '425' },

  { city: 'Tacoma', county: 'Pierce', lat: 47.2529, lng: -122.4443, zip: '98405', areaCode: '253' },
  { city: 'Tacoma', county: 'Pierce', lat: 47.2488, lng: -122.4544, zip: '98405', areaCode: '253' },
  { city: 'Lakewood', county: 'Pierce', lat: 47.1718, lng: -122.5185, zip: '98499', areaCode: '253' },
  { city: 'Puyallup', county: 'Pierce', lat: 47.1854, lng: -122.2929, zip: '98371', areaCode: '253' },
  { city: 'University Place', county: 'Pierce', lat: 47.2227, lng: -122.5399, zip: '98466', areaCode: '253' },
  { city: 'Gig Harbor', county: 'Pierce', lat: 47.3318, lng: -122.5801, zip: '98335', areaCode: '253' },
  { city: 'Sumner', county: 'Pierce', lat: 47.2032, lng: -122.2401, zip: '98390', areaCode: '253' },
  { city: 'Parkland', county: 'Pierce', lat: 47.1551, lng: -122.4340, zip: '98444', areaCode: '253' },
  { city: 'Spanaway', county: 'Pierce', lat: 47.1036, lng: -122.4274, zip: '98387', areaCode: '253' },
  { city: 'Bonney Lake', county: 'Pierce', lat: 47.0226, lng: -122.1812, zip: '98391', areaCode: '253' },

  { city: 'Vancouver', county: 'Clark', lat: 45.6308, lng: -122.6031, zip: '98661', areaCode: '360' },
  { city: 'Vancouver', county: 'Clark', lat: 45.6257, lng: -122.5695, zip: '98664', areaCode: '360' },
  { city: 'Camas', county: 'Clark', lat: 45.5859, lng: -122.4015, zip: '98607', areaCode: '360' },
  { city: 'Battle Ground', county: 'Clark', lat: 45.7809, lng: -122.5445, zip: '98604', areaCode: '360' },
  { city: 'Washougal', county: 'Clark', lat: 45.6353, lng: -122.3538, zip: '98671', areaCode: '360' },
  { city: 'Ridgefield', county: 'Clark', lat: 45.8151, lng: -122.7348, zip: '98642', areaCode: '360' },

  { city: 'Everett', county: 'Snohomish', lat: 47.9790, lng: -122.2040, zip: '98201', areaCode: '425' },
  { city: 'Snohomish', county: 'Snohomish', lat: 47.9129, lng: -122.0982, zip: '98290', areaCode: '360' },
  { city: 'Marysville', county: 'Snohomish', lat: 48.0518, lng: -122.1760, zip: '98270', areaCode: '360' },
  { city: 'Lynnwood', county: 'Snohomish', lat: 47.8195, lng: -122.2963, zip: '98036', areaCode: '425' },
  { city: 'Edmonds', county: 'Snohomish', lat: 47.8107, lng: -122.3774, zip: '98020', areaCode: '425' },
  { city: 'Mountlake Terrace', county: 'Snohomish', lat: 47.7893, lng: -122.3076, zip: '98043', areaCode: '425' },
  { city: 'Bothell', county: 'Snohomish', lat: 47.7601, lng: -122.2054, zip: '98011', areaCode: '425' },
  { city: 'Mukilteo', county: 'Snohomish', lat: 47.9126, lng: -122.3043, zip: '98275', areaCode: '425' },
  { city: 'Arlington', county: 'Snohomish', lat: 48.1895, lng: -122.1261, zip: '98223', areaCode: '360' },
  { city: 'Monroe', county: 'Snohomish', lat: 47.8553, lng: -121.9721, zip: '98272', areaCode: '360' },
  { city: 'Stanwood', county: 'Snohomish', lat: 48.2415, lng: -122.3514, zip: '98292', areaCode: '360' },

  { city: 'Olympia', county: 'Thurston', lat: 47.0379, lng: -122.9007, zip: '98501', areaCode: '360' },
  { city: 'Lacey', county: 'Thurston', lat: 47.0343, lng: -122.8234, zip: '98503', areaCode: '360' },
  { city: 'Tumwater', county: 'Thurston', lat: 47.0073, lng: -122.9093, zip: '98501', areaCode: '360' },
  { city: 'Yelm', county: 'Thurston', lat: 46.9421, lng: -122.6056, zip: '98597', areaCode: '360' },
  { city: 'Tenino', county: 'Thurston', lat: 46.8563, lng: -122.8526, zip: '98589', areaCode: '360' },

  { city: 'Bellingham', county: 'Whatcom', lat: 48.7490, lng: -122.4781, zip: '98225', areaCode: '360' },
  { city: 'Bellingham', county: 'Whatcom', lat: 48.7596, lng: -122.4882, zip: '98226', areaCode: '360' },
  { city: 'Ferndale', county: 'Whatcom', lat: 48.8476, lng: -122.5907, zip: '98248', areaCode: '360' },
  { city: 'Lynden', county: 'Whatcom', lat: 48.9462, lng: -122.4560, zip: '98264', areaCode: '360' },
  { city: 'Blaine', county: 'Whatcom', lat: 48.9907, lng: -122.7471, zip: '98230', areaCode: '360' },

  { city: 'Bremerton', county: 'Kitsap', lat: 47.5673, lng: -122.6266, zip: '98337', areaCode: '360' },
  { city: 'Port Orchard', county: 'Kitsap', lat: 47.5327, lng: -122.6378, zip: '98366', areaCode: '360' },
  { city: 'Silverdale', county: 'Kitsap', lat: 47.6445, lng: -122.6949, zip: '98383', areaCode: '360' },
  { city: 'Poulsbo', county: 'Kitsap', lat: 47.7363, lng: -122.6455, zip: '98370', areaCode: '360' },
  { city: 'Bainbridge Island', county: 'Kitsap', lat: 47.6262, lng: -122.5210, zip: '98110', areaCode: '206' },

  { city: 'Wenatchee', county: 'Chelan', lat: 47.4235, lng: -120.3102, zip: '98801', areaCode: '509' },
  { city: 'East Wenatchee', county: 'Douglas', lat: 47.4187, lng: -120.2824, zip: '98802', areaCode: '509' },
  { city: 'Leavenworth', county: 'Chelan', lat: 47.5962, lng: -120.6635, zip: '98826', areaCode: '509' },
  { city: 'Chelan', county: 'Chelan', lat: 47.8398, lng: -120.0163, zip: '98816', areaCode: '509' },
  { city: 'Cashmere', county: 'Chelan', lat: 47.5230, lng: -120.4683, zip: '98815', areaCode: '509' },

  { city: 'Yakima', county: 'Yakima', lat: 46.6021, lng: -120.5059, zip: '98902', areaCode: '509' },
  { city: 'Yakima', county: 'Yakima', lat: 46.5901, lng: -120.5660, zip: '98908', areaCode: '509' },
  { city: 'Toppenish', county: 'Yakima', lat: 46.3750, lng: -120.3147, zip: '98948', areaCode: '509' },
  { city: 'Sunnyside', county: 'Yakima', lat: 46.3236, lng: -119.9910, zip: '98944', areaCode: '509' },
  { city: 'Selah', county: 'Yakima', lat: 46.6567, lng: -120.5300, zip: '98942', areaCode: '509' },
  { city: 'Ellensburg', county: 'Kittitas', lat: 47.0018, lng: -120.5479, zip: '98926', areaCode: '509' },
  { city: 'Grandview', county: 'Yakima', lat: 46.2658, lng: -119.9410, zip: '98930', areaCode: '509' },

  { city: 'Richland', county: 'Benton', lat: 46.2804, lng: -119.2752, zip: '99352', areaCode: '509' },
  { city: 'Kennewick', county: 'Benton', lat: 46.2112, lng: -119.1373, zip: '99336', areaCode: '509' },
  { city: 'Pasco', county: 'Franklin', lat: 46.2396, lng: -119.0982, zip: '99301', areaCode: '509' },
  { city: 'West Richland', county: 'Benton', lat: 46.2860, lng: -119.3531, zip: '99353', areaCode: '509' },
  { city: 'Burbank', county: 'Walla Walla', lat: 46.1962, lng: -118.9720, zip: '99323', areaCode: '509' },

  { city: 'Walla Walla', county: 'Walla Walla', lat: 46.0646, lng: -118.3430, zip: '99362', areaCode: '509' },
  { city: 'College Place', county: 'Walla Walla', lat: 46.0424, lng: -118.3881, zip: '99324', areaCode: '509' },

  { city: 'Moses Lake', county: 'Grant', lat: 47.1301, lng: -119.2782, zip: '98837', areaCode: '509' },
  { city: 'Ephrata', county: 'Grant', lat: 47.3240, lng: -119.5485, zip: '98823', areaCode: '509' },
  { city: 'Quincy', county: 'Grant', lat: 47.2345, lng: -119.8488, zip: '98848', areaCode: '509' },

  { city: 'Pullman', county: 'Whitman', lat: 46.7311, lng: -117.1796, zip: '99163', areaCode: '509' },
  { city: 'Colfax', county: 'Whitman', lat: 46.8797, lng: -117.3657, zip: '99111', areaCode: '509' },
  { city: 'Rosalia', county: 'Whitman', lat: 47.2385, lng: -117.3698, zip: '99170', areaCode: '509' },

  { city: 'Port Angeles', county: 'Clallam', lat: 48.1182, lng: -123.4334, zip: '98362', areaCode: '360' },
  { city: 'Sequim', county: 'Clallam', lat: 48.0795, lng: -123.1018, zip: '98382', areaCode: '360' },
  { city: 'Forks', county: 'Clallam', lat: 47.9504, lng: -124.3159, zip: '98331', areaCode: '360' },

  { city: 'Port Townsend', county: 'Jefferson', lat: 48.1168, lng: -122.7604, zip: '98368', areaCode: '360' },
  { city: 'Chimacum', county: 'Jefferson', lat: 47.9982, lng: -122.7701, zip: '98365', areaCode: '360' },

  { city: 'Omak', county: 'Okanogan', lat: 48.4107, lng: -119.5259, zip: '98841', areaCode: '509' },
  { city: 'Okanogan', county: 'Okanogan', lat: 48.3659, lng: -119.5856, zip: '98840', areaCode: '509' },
  { city: 'Oroville', county: 'Okanogan', lat: 48.9390, lng: -119.4392, zip: '98844', areaCode: '509' },
  { city: 'Twisp', county: 'Okanogan', lat: 48.3646, lng: -120.1232, zip: '98856', areaCode: '509' },
  { city: 'Winthrop', county: 'Okanogan', lat: 48.4743, lng: -120.1810, zip: '98862', areaCode: '509' },

  { city: 'Colville', county: 'Stevens', lat: 48.5449, lng: -117.9046, zip: '99114', areaCode: '509' },
  { city: 'Chewelah', county: 'Stevens', lat: 48.2872, lng: -117.7149, zip: '99109', areaCode: '509' },
  { city: 'Kettle Falls', county: 'Stevens', lat: 48.6108, lng: -118.0596, zip: '99141', areaCode: '509' },

  { city: 'Chehalis', county: 'Lewis', lat: 46.6621, lng: -122.9660, zip: '98532', areaCode: '360' },
  { city: 'Centralia', county: 'Lewis', lat: 46.7162, lng: -122.9543, zip: '98531', areaCode: '360' },
  { city: 'Morton', county: 'Lewis', lat: 46.5571, lng: -122.2828, zip: '98356', areaCode: '360' },

  { city: 'Longview', county: 'Cowlitz', lat: 46.1382, lng: -122.9382, zip: '98632', areaCode: '360' },
  { city: 'Kelso', county: 'Cowlitz', lat: 46.1463, lng: -122.9087, zip: '98626', areaCode: '360' },
  { city: 'Woodland', county: 'Cowlitz', lat: 45.9046, lng: -122.7413, zip: '98674', areaCode: '360' },

  { city: 'Wenatchee', county: 'Chelan', lat: 47.4355, lng: -122.3160, zip: '98801', areaCode: '509' },
  { city: 'Aberdeen', county: 'Grays Harbor', lat: 46.9754, lng: -123.8160, zip: '98520', areaCode: '360' },
  { city: 'Hoquiam', county: 'Grays Harbor', lat: 46.9807, lng: -123.8893, zip: '98550', areaCode: '360' },
  { city: 'Ocean Shores', county: 'Grays Harbor', lat: 46.9745, lng: -124.1550, zip: '98569', areaCode: '360' },
  { city: 'Montesano', county: 'Grays Harbor', lat: 47.6071, lng: -123.5960, zip: '98563', areaCode: '360' },

  { city: 'Burlington', county: 'Skagit', lat: 48.4848, lng: -122.3370, zip: '98233', areaCode: '360' },
  { city: 'Mount Vernon', county: 'Skagit', lat: 48.4212, lng: -122.3321, zip: '98273', areaCode: '360' },
  { city: 'Anacortes', county: 'Skagit', lat: 48.5099, lng: -122.6127, zip: '98221', areaCode: '360' },
  { city: 'Sedro-Woolley', county: 'Skagit', lat: 48.5040, lng: -122.2343, zip: '98284', areaCode: '360' },
  { city: 'La Conner', county: 'Skagit', lat: 48.3926, lng: -122.4960, zip: '98257', areaCode: '360' },

  { city: 'Friday Harbor', county: 'San Juan', lat: 48.5342, lng: -123.0177, zip: '98250', areaCode: '360' },
  { city: 'Eastsound', county: 'San Juan', lat: 48.6966, lng: -122.9097, zip: '98245', areaCode: '360' },

  { city: 'Goldendale', county: 'Klickitat', lat: 45.8207, lng: -120.8215, zip: '98620', areaCode: '509' },
  { city: 'White Salmon', county: 'Klickitat', lat: 45.7282, lng: -121.4865, zip: '98672', areaCode: '509' },

  { city: 'Stevenson', county: 'Skamania', lat: 45.6907, lng: -121.8848, zip: '98648', areaCode: '509' },

  { city: 'Dayton', county: 'Columbia', lat: 46.3190, lng: -117.9816, zip: '99328', areaCode: '509' },
  { city: 'Pomeroy', county: 'Garfield', lat: 46.4742, lng: -117.4824, zip: '99347', areaCode: '509' },
  { city: 'Asotin', county: 'Asotin', lat: 46.3360, lng: -117.0482, zip: '99402', areaCode: '509' },
  { city: 'Clarkston', county: 'Asotin', lat: 46.4146, lng: -117.0460, zip: '99403', areaCode: '509' },
  { city: 'Gold Bar', county: 'Snohomish', lat: 47.8576, lng: -121.6932, zip: '98251', areaCode: '360' },
  { city: 'Index', county: 'Snohomish', lat: 47.8207, lng: -121.5544, zip: '98256', areaCode: '360' },
  { city: 'Ocean Shores', county: 'Grays Harbor', lat: 46.9712, lng: -124.1560, zip: '98569', areaCode: '360' },
  { city: 'Pacific', county: 'King', lat: 47.2643, lng: -122.2499, zip: '98047', areaCode: '253' },
  { city: 'Black Diamond', county: 'King', lat: 47.3168, lng: -122.0051, zip: '98010', areaCode: '360' },
  { city: 'Enumclaw', county: 'King', lat: 47.2029, lng: -121.9907, zip: '98022', areaCode: '360' },
  { city: 'North Bend', county: 'King', lat: 47.4957, lng: -121.7824, zip: '98045', areaCode: '425' },
  { city: 'Duvall', county: 'King', lat: 47.7432, lng: -121.9857, zip: '98019', areaCode: '425' },
  { city: 'Snoqualmie', county: 'King', lat: 47.5287, lng: -121.8254, zip: '98065', areaCode: '425' },
  { city: 'Carnation', county: 'King', lat: 47.6462, lng: -121.9210, zip: '98014', areaCode: '425' },
  { city: 'Maple Valley', county: 'King', lat: 47.3934, lng: -122.0451, zip: '98038', areaCode: '425' },
  { city: 'Covington', county: 'King', lat: 47.3581, lng: -122.1079, zip: '98042', areaCode: '253' },
  { city: 'SeaTac', county: 'King', lat: 47.4484, lng: -122.2912, zip: '98188', areaCode: '206' },
  { city: 'Tukwila', county: 'King', lat: 47.4683, lng: -122.2607, zip: '98188', areaCode: '206' },
  { city: 'Newcastle', county: 'King', lat: 47.5305, lng: -122.1640, zip: '98059', areaCode: '425' },
  { city: 'Medina', county: 'King', lat: 47.6201, lng: -122.2290, zip: '98039', areaCode: '425' },
  { city: 'Yarrow Point', county: 'King', lat: 47.6440, lng: -122.2185, zip: '98004', areaCode: '425' },
  { city: 'Hunts Point', county: 'King', lat: 47.6435, lng: -122.2340, zip: '98004', areaCode: '425' },
  { city: 'Clyde Hill', county: 'King', lat: 47.6315, lng: -122.2180, zip: '98004', areaCode: '425' },
  { city: 'Beaux Arts Village', county: 'King', lat: 47.5870, lng: -122.1970, zip: '98004', areaCode: '425' },
  { city: 'Woodinville', county: 'King', lat: 47.7542, lng: -122.1629, zip: '98072', areaCode: '425' },
  { city: 'Fall City', county: 'King', lat: 47.5668, lng: -121.8890, zip: '98024', areaCode: '425' },
  { city: 'Vashon', county: 'King', lat: 47.4194, lng: -122.4631, zip: '98070', areaCode: '206' },
  { city: 'Skykomish', county: 'King', lat: 47.7054, lng: -121.3586, zip: '98288', areaCode: '360' },
  { city: 'Ruston', county: 'Pierce', lat: 47.2954, lng: -122.5130, zip: '98407', areaCode: '253' },
  { city: 'Edgewood', county: 'Pierce', lat: 47.2443, lng: -122.3024, zip: '98371', areaCode: '253' },
  { city: 'Milton', county: 'Pierce', lat: 47.2512, lng: -122.3165, zip: '98354', areaCode: '253' },
  { city: 'Fife', county: 'Pierce', lat: 47.2396, lng: -122.3585, zip: '98424', areaCode: '253' },
  { city: 'Puyallup', county: 'Pierce', lat: 47.1950, lng: -122.2850, zip: '98372', areaCode: '253' },
  { city: 'Orting', county: 'Pierce', lat: 47.0940, lng: -122.2024, zip: '98360', areaCode: '360' },
  { city: 'Eatonville', county: 'Pierce', lat: 46.8673, lng: -122.2665, zip: '98328', areaCode: '360' },
  { city: 'Steilacoom', county: 'Pierce', lat: 47.1682, lng: -122.5943, zip: '98388', areaCode: '253' },
  { city: 'DuPont', county: 'Pierce', lat: 47.0915, lng: -122.6360, zip: '98327', areaCode: '253' },
  { city: 'Roy', county: 'Pierce', lat: 46.9770, lng: -122.5459, zip: '98580', areaCode: '253' },
  { city: 'McChord AFB', county: 'Pierce', lat: 47.1334, lng: -122.4870, zip: '98438', areaCode: '253' },
  { city: 'Anderson Island', county: 'Pierce', lat: 47.1632, lng: -122.7093, zip: '98303', areaCode: '253' },
  { city: 'Longbranch', county: 'Pierce', lat: 47.2082, lng: -122.7120, zip: '98351', areaCode: '253' },
];

// ===== Resource name patterns by category =====
interface CategoryTemplate {
  slug: string;
  namePrefixes: string[];
  nameSuffixes: string[];
  description: string;
  services: string[];
  specialties?: string[];
  costMin: number;
  costMax: number;
  hoursDefault: Record<string, string>;
  medicaidLikely: number;
  freeLikely: number;
  telehealthLikely: number;
  walkinLikely: number;
  languages: string[];
  audiences?: string[];
}

const TEMPLATES: CategoryTemplate[] = [
  {
    slug: 'hospital',
    namePrefixes: ['Virginia Mason Franciscan', 'MultiCare', 'Providence', 'PeaceHealth', 'Swedish', 'UW Medicine', 'Confluence', 'Kadlec', 'Jefferson Healthcare', 'Island Health', 'Skagit Valley', 'Whatcom County', 'WhidbeyHealth', 'Cascade Medical', 'Cascade Regional', 'Cascade Valley', 'Wenatchee Valley', 'Okanogan Valley', 'Kittitas Valley', 'Chatham County', 'Skyline', 'Northwest', 'Cascade', 'Evergreen', 'Olympic', 'Pacific Cascade', 'Willapa', 'Columbia Basin', 'Palouse', 'Inland Northwest'],
    nameSuffixes: ['Medical Center', 'Regional Hospital', 'Community Hospital', 'General Hospital', 'Memorial Hospital', 'Hospital & Medical Center', 'Health Center', 'Hospital Campus'],
    description: 'Full-service hospital providing comprehensive inpatient, outpatient, and emergency care for the surrounding community.',
    services: ['Emergency care', 'Inpatient surgery', 'Outpatient surgery', 'ICU', 'Maternity', 'Cardiology', 'Radiology', 'Laboratory', 'Pharmacy'],
    costMin: 1200,
    costMax: 5000,
    hoursDefault: { mon: '24 hours', tue: '24 hours', wed: '24 hours', thu: '24 hours', fri: '24 hours', sat: '24 hours', sun: '24 hours' },
    medicaidLikely: 0.9,
    freeLikely: 0.1,
    telehealthLikely: 0.3,
    walkinLikely: 0.8,
    languages: ['English', 'Spanish'],
  },
  {
    slug: 'primary-care',
    namePrefixes: ['Sea Mar', 'Neighborcare', 'Country Doctor', 'CHAS', 'Unity Care', 'Community Health', 'Puget Sound', 'Cascade', 'Evergreen', 'Olympic', 'Pacific', 'Riverside', 'Greenway', 'Highland', 'Valley', 'RidgeVIEW', 'Northwest', 'Soundview', 'Lakeshore', 'Eastside', 'Westside', 'Northgate', 'Southcenter', 'Downtown', 'Hilltop', 'Maple', 'Cedar', 'Birch', 'Pine', 'Aspen', 'Willow', 'Foothill', 'Riverside', 'Belmont', 'Fairview', 'Grandview', 'Summit', 'Harborview', 'Bayview', 'Columbia', 'Skyline', 'Mountain View', 'Sunrise', 'Sunset', 'Pioneer', 'Heritage', 'Cornerstone', 'Bridgewood', 'Clearwater', 'Lakeside', 'Forest', 'Parkside', 'Ridgeline', 'Spokane Falls', 'Cascadia', 'Evergreen Family', 'Rainier', 'Olympic Peninsula', 'Peninsula', 'Salish', 'Stillaguamish', 'Snoqualmie Valley', 'Snohomish County', 'Skagit Valley', 'Whatcom County', 'Island County', 'Jefferson County', 'Clallam County', 'Mason County', 'Thurston County', 'Lewis County', 'Cowlitz County', 'Wahkiakum County', 'Pacific County', 'Grays Harbor County', 'Yakima Valley', 'Kittitas Valley', 'Chelan County', 'Douglas County', 'Okanogan County', 'Grant County', 'Adams County', 'Lincoln County', 'Spokane County', 'Stevens County', 'Pend Oreille County', 'Whitman County', 'Asotin County', 'Garfield County', 'Columbia County', 'Walla Walla County', 'Franklin County', 'Benton County', 'Klickitat County', 'Skamania County'],
    nameSuffixes: ['Family Medicine', 'Primary Care', 'Medical Clinic', 'Health Clinic', 'Community Clinic', 'Family Health', 'Internal Medicine', 'Community Health Center', 'Neighborhood Clinic', 'Walk-in Clinic'],
    description: 'Primary care clinic providing family medicine, preventive care, and chronic disease management for all ages.',
    services: ['Primary care', 'Preventive care', 'Vaccinations', 'Chronic disease management', 'Annual physicals', 'Lab tests', 'Minor procedures'],
    costMin: 80,
    costMax: 300,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-19:00', fri: '8:00-17:00', sat: 'Closed', sun: 'Closed' },
    medicaidLikely: 0.75,
    freeLikely: 0.3,
    telehealthLikely: 0.6,
    walkinLikely: 0.3,
    languages: ['English', 'Spanish'],
  },
  {
    slug: 'specialist',
    namePrefixes: ['Cascade', 'Northwest', 'Pacific', 'Olympic', 'Evergreen', 'Riverside', 'Valley', 'Summit', 'Pioneer', 'Heritage', 'Bridgewood', 'Clearwater', 'Lakeside', 'Forest', 'Parkside', 'Eastside', 'Soundview', 'Salish', 'Rainier', 'Spokane Falls', 'Cascadia', 'Plateau', 'Highland', 'Ridgeline', 'Harborview', 'Bayview', 'Columbia', 'Skyline', 'Mountain View', 'Sunrise', 'Cornerstone'],
    nameSuffixes: ['Cardiology', 'Dermatology Associates', 'Orthopedic Specialists', 'Neurology Clinic', 'Gastroenterology', 'Urology Associates', 'Endocrinology Center', 'Rheumatology', 'Oncology Associates', 'Ophthalmology', 'ENT Specialists', 'Allergy & Asthma', 'Pulmonology', 'Nephrology', 'Hematology'],
    description: 'Specialist medical practice providing expert diagnosis and treatment for specific conditions.',
    services: ['Specialist consultation', 'Diagnostic testing', 'Treatment planning', 'Pre-surgical evaluation', 'Follow-up care'],
    specialties: ['Cardiology', 'Dermatology', 'Orthopedics', 'Neurology', 'Gastroenterology', 'Urology', 'Endocrinology', 'Rheumatology', 'Oncology', 'Ophthalmology', 'ENT', 'Allergy', 'Pulmonology', 'Nephrology', 'Hematology'],
    costMin: 200,
    costMax: 600,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-17:00', fri: '8:00-17:00', sat: 'Closed', sun: 'Closed' },
    medicaidLikely: 0.5,
    freeLikely: 0.05,
    telehealthLikely: 0.5,
    walkinLikely: 0.1,
    languages: ['English'],
  },
  {
    slug: 'dental',
    namePrefixes: ['Smile Squad', 'Bright Smile', 'Gentle Dental', 'Evergreen Dental', 'Cascade Dental', 'Family Dental', 'Community Dental', 'Riverside Dental', 'Northwest Dental', 'Pacific Dental', 'Olympic Dental', 'Greenway Dental', 'Summit Dental', 'Cornerstone Dental', 'Heritage Dental', 'Lakeside Dental', 'Parkside Dental', 'Sunrise Dental', 'Bellevue Dental', 'Soundview Dental', 'Mountain View Dental', 'Aspen Dental', 'Willow Dental', 'Cedar Dental', 'Pine Dental', 'Birch Dental', 'Maple Dental', 'Foothill Dental', 'Valley Dental', 'Highland Dental'],
    nameSuffixes: ['Family Dentistry', 'Dental Care', 'Dental Clinic', 'Dental Group', 'Pediatric Dentistry', 'Orthodontics', 'Oral Surgery', 'Dental Associates'],
    description: 'Dental clinic offering preventive, restorative, and emergency dental services for the whole family.',
    services: ['Cleanings', 'Fillings', 'Root canals', 'Extractions', 'Crowns', 'Bridges', 'Dentures', 'Emergency dental', 'Pediatric dentistry'],
    specialties: ['General dentistry', 'Orthodontics', 'Oral surgery', 'Pediatric dentistry', 'Periodontics', 'Endodontics'],
    costMin: 90,
    costMax: 400,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-19:00', fri: '8:00-17:00', sat: 'Closed', sun: 'Closed' },
    medicaidLikely: 0.6,
    freeLikely: 0.2,
    telehealthLikely: 0.05,
    walkinLikely: 0.2,
    languages: ['English', 'Spanish'],
  },
  {
    slug: 'mental-health',
    namePrefixes: ['Mindful', 'Harmony', 'Serenity', 'Hope', 'Healing Path', 'Compassionate', 'Lighthouse', 'Anchor', 'Beacon', 'Lantern', 'Sanctuary', 'Renewal', 'Pine Ridge', 'Cedar Grove', 'Birch Hollow', 'Maple Grove', 'Evergreen', 'Cascade Counseling', 'Pacific Behavioral', 'Olympic Psychological', 'Riverside', 'Soundview', 'Lakeview', 'Greenway Behavioral', 'Northwest Therapeutic', 'Spokane Mental', 'Salish Sea', 'Rainier', 'Stillaguamish', 'Snoqualmie', 'Skagit Valley', 'Whatcom', 'Jefferson', 'Clallam', 'Mason', 'Thurston', 'Lewis', 'Cowlitz', 'Yakima Valley', 'Kittitas', 'Chelan', 'Douglas', 'Okanogan', 'Grant', 'Lincoln', 'Spokane', 'Stevens', 'Pend Oreille', 'Whitman', 'Asotin', 'Walla Walla', 'Franklin', 'Benton', 'Klickitat', 'Skamania'],
    nameSuffixes: ['Counseling', 'Therapy Associates', 'Mental Health', 'Behavioral Health', 'Psychiatric Services', 'Therapy & Wellness', 'Counseling Center', 'Psychological Services', 'Wellness Center', 'Therapy Group', 'Mental Wellness'],
    description: 'Mental health clinic providing therapy, counseling, and psychiatric services for individuals, couples, and families.',
    services: ['Individual therapy', 'Couples counseling', 'Family therapy', 'Psychiatric evaluation', 'Medication management', 'Group therapy', 'Trauma therapy', 'CBT', 'EMDR'],
    specialties: ['Anxiety', 'Depression', 'Trauma/PTSD', 'Couples therapy', 'Adolescent psychiatry', 'LGBTQ+ affirming', 'ADHD', 'Addiction counseling', 'Eating disorders', 'Grief counseling'],
    costMin: 80,
    costMax: 250,
    hoursDefault: { mon: '9:00-17:00', tue: '9:00-17:00', wed: '9:00-17:00', thu: '9:00-19:00', fri: '9:00-17:00', sat: 'Closed', sun: 'Closed' },
    medicaidLikely: 0.7,
    freeLikely: 0.25,
    telehealthLikely: 0.85,
    walkinLikely: 0.05,
    languages: ['English', 'Spanish'],
    audiences: ['Adults', 'Adolescents', 'Couples', 'Families'],
  },
  {
    slug: 'substance-use',
    namePrefixes: ['New Pathways', 'Rising Sun', 'Hope Harbor', 'Recovery', 'Journey', 'Freedom', 'Turning Point', 'Crossroads', 'New Dawn', 'Bright Future', 'Safe Harbor', 'Anchor', 'Compass', 'Beacon', 'Lantern', 'Pioneer', 'Cornerstone', 'Bridgeway', 'Passages', 'Threshold', 'Cascade', 'Evergreen', 'Pacific', 'Olympic', 'Riverside', 'Valley', 'Summit', 'Soundview', 'Lakeview', 'Greenway', 'Northwest', 'Salish'],
    nameSuffixes: ['Recovery Center', 'Treatment Center', 'Addiction Services', 'Rehabilitation', 'Recovery & Wellness', 'Addiction Treatment', 'Sobriety Center', 'Recovery Program'],
    description: 'Substance use treatment center offering detox, counseling, medication-assisted treatment, and recovery support.',
    services: ['Medical detox', 'Outpatient treatment', 'Intensive outpatient (IOP)', 'Medication-assisted treatment (MAT)', 'Individual counseling', 'Group therapy', 'Relapse prevention', 'Family support', 'Aftercare planning'],
    specialties: ['Alcohol use disorder', 'Opioid use disorder', 'Stimulant use', 'Co-occurring disorders', 'Medication-assisted treatment (MAT)', 'Dual diagnosis'],
    costMin: 0,
    costMax: 200,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-17:00', fri: '8:00-17:00', sat: '9:00-13:00', sun: 'Closed' },
    medicaidLikely: 0.85,
    freeLikely: 0.4,
    telehealthLikely: 0.5,
    walkinLikely: 0.3,
    languages: ['English', 'Spanish'],
    audiences: ['Adults', 'Young adults'],
  },
  {
    slug: 'community-org',
    namePrefixes: ['United Way', 'Catholic Charities', 'Salvation Army', 'Volunteers of America', 'YMCA', 'YWCA', 'Boys & Girls Club', 'Goodwill', 'St. Vincent de Paul', 'Lutheran Community Services', 'Jewish Family Services', 'Muslim Association', 'Asian Counseling', 'Latino Community', 'African American', 'Native American', 'Refugee & Immigrant', 'Pioneer', 'Neighborcare', 'Community Action', 'Family Support', 'Rainier', 'Cascadia', 'Skyline', 'Greenway', 'Soundview', 'Northwest', 'Pacific'],
    nameSuffixes: ['of Washington', 'Community Services', 'Family Services', 'Resource Center', 'Community Center', 'Neighborhood House', 'Outreach Center', 'Family Resource Center', 'Social Services', 'Support Services'],
    description: 'Community organization offering social services, support programs, and resources for families and individuals in need.',
    services: ['Case management', 'Food assistance', 'Housing assistance', 'Utility assistance', 'Job training', 'ESL classes', 'Citizenship help', 'Youth programs', 'Senior services', 'Crisis support'],
    costMin: 0,
    costMax: 0,
    hoursDefault: { mon: '9:00-17:00', tue: '9:00-17:00', wed: '9:00-17:00', thu: '9:00-17:00', fri: '9:00-17:00', sat: 'Closed', sun: 'Closed' },
    medicaidLikely: 0.3,
    freeLikely: 0.95,
    telehealthLikely: 0.2,
    walkinLikely: 0.6,
    languages: ['English', 'Spanish', 'Vietnamese', 'Somali', 'Amharic'],
    audiences: ['Families', 'Seniors', 'Youth', 'Veterans', 'Immigrants'],
  },
  {
    slug: 'food-bank',
    namePrefixes: ['Northwest', 'Cascade', 'Evergreen', 'Pacific', 'Olympic', 'Riverside', 'Valley', 'Summit', 'Greenway', 'Soundview', 'Lakeview', 'Community', 'Neighborhood', 'Heritage', 'Harvest', 'Rainier', 'Salish', 'Spokane', 'Cascadia', 'Volunteers of America', 'Catholic Charities', 'Salvation Army', 'Hope', 'Bread of Life', 'Daily Bread', 'Second Harvest', 'Food Lifeline', 'Northwest Harvest', 'St. Mary', 'St. Vincent', 'Community Action'],
    nameSuffixes: ['Food Bank', 'Food Pantry', 'Food Distribution', 'Meal Program', 'Community Kitchen', 'Food Resource Center', 'Nutrition Center', 'Food Assistance'],
    description: 'Food bank providing groceries, meals, and nutrition assistance to individuals and families facing food insecurity.',
    services: ['Food pantry', 'Hot meals', 'Grocery distribution', 'SNAP enrollment', 'Senior food boxes', 'Backpack program', 'Produce distribution'],
    costMin: 0,
    costMax: 0,
    hoursDefault: { mon: '10:00-15:00', tue: '10:00-15:00', wed: '10:00-15:00', thu: '12:00-18:00', fri: '10:00-15:00', sat: '9:00-12:00', sun: 'Closed' },
    medicaidLikely: 0.1,
    freeLikely: 1.0,
    telehealthLikely: 0.0,
    walkinLikely: 0.9,
    languages: ['English', 'Spanish', 'Russian', 'Vietnamese'],
    audiences: ['Families', 'Seniors', 'Children', 'Unhoused'],
  },
  {
    slug: 'transportation',
    namePrefixes: ['MediRide', 'MedTrans', 'Health Ride', 'Care Transport', 'Hopelink', 'Medical Express', 'Cascade Transportation', 'Northwest MedTrans', 'Pacific Ride', 'Sound Transit', 'Community Transit', 'Pierce Transit', 'Evergreen Ride', 'Olympic Transport', 'Riverside Medical Transport', 'Valley Medical Ride', 'Volunteer Drivers', 'Community Rides', 'MediVan', 'Access Transportation'],
    nameSuffixes: ['Medical Transportation', 'NEMT Services', 'Transport Services', 'Ride Service', 'Medical Transport', 'Non-Emergency Medical Transport', 'Healthcare Transportation'],
    description: 'Medical transportation service providing non-emergency rides to medical appointments for those without transportation.',
    services: ['Non-emergency medical transport (NEMT)', 'Wheelchair accessible vans', 'Door-to-door service', 'Appointment rides', 'Pharmacy pickup', 'Dialysis transportation', 'Mental health appointments'],
    costMin: 0,
    costMax: 15,
    hoursDefault: { mon: '6:00-18:00', tue: '6:00-18:00', wed: '6:00-18:00', thu: '6:00-18:00', fri: '6:00-18:00', sat: '7:00-14:00', sun: 'Closed' },
    medicaidLikely: 0.8,
    freeLikely: 0.5,
    telehealthLikely: 0.0,
    walkinLikely: 0.3,
    languages: ['English', 'Spanish'],
    audiences: ['Seniors', 'Disabled', 'Low-income', 'Veterans'],
  },
  {
    slug: 'insurance-assistance',
    namePrefixes: ['Washington Healthplan', 'Community Health Access', 'Insurance Navigator', 'Enroll WA', 'Apple Health', 'Medicaid Enrollment', 'ACA Navigator', 'Washington State', 'King County', 'Pierce County', 'Snohomish County', 'Spokane County', 'Cascade Health Benefits', 'Northwest Insurance', 'Pacific Health Access', 'Soundview Insurance', 'Community Enrollment'],
    nameSuffixes: ['Assistance Program', 'Enrollment Center', 'Benefits Center', 'Health Insurance Navigator', 'Coverage Services', 'Enrollment Assistance', 'Insurance Help', 'Benefits Navigation'],
    description: 'Health insurance assistance program helping individuals and families enroll in Medicaid, Medicare, and ACA marketplace plans.',
    services: ['Medicaid enrollment', 'Apple Health application', 'ACA marketplace navigation', 'Medicare assistance', 'CHIP enrollment', 'Renewals', 'Plan comparison', 'Coverage appeals', 'Language assistance'],
    costMin: 0,
    costMax: 0,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-19:00', fri: '8:00-17:00', sat: '9:00-13:00', sun: 'Closed' },
    medicaidLikely: 0.3,
    freeLikely: 1.0,
    telehealthLikely: 0.4,
    walkinLikely: 0.4,
    languages: ['English', 'Spanish', 'Vietnamese', 'Korean', 'Mandarin', 'Cantonese', 'Amharic', 'Somali', 'Russian', 'Tagalog'],
    audiences: ['Families', 'Immigrants', 'Low-income', 'Seniors'],
  },
  {
    slug: 'telehealth',
    namePrefixes: ['Teladoc', 'Amwell', '98point6', 'Doctor on Demand', 'Lemonaid', 'PlushCare', 'Seattle Virtual', 'Evergreen Telehealth', 'Cascade Virtual Care', 'Pacific Telehealth', 'Olympic Virtual', 'Soundview Telehealth', 'Northwest Virtual', 'Cascadia Telehealth', 'Washington Telehealth', 'Salish Telehealth', 'Rainier Virtual Care', 'Spokane Virtual', 'Skyline Telehealth'],
    nameSuffixes: ['Virtual Care', 'Telehealth Services', 'Online Doctor', 'Virtual Clinic', 'Remote Care', 'Digital Health', 'Telemedicine', 'Virtual Health'],
    description: 'Virtual care provider offering video and phone visits for primary care, urgent care, and behavioral health across Washington State.',
    services: ['Video visits', 'Phone visits', 'Prescriptions', 'Follow-up appointments', 'Minor illness treatment', 'Mental health visits', 'Medication refills', 'Specialist referrals'],
    costMin: 40,
    costMax: 150,
    hoursDefault: { mon: '7:00-23:00', tue: '7:00-23:00', wed: '7:00-23:00', thu: '7:00-23:00', fri: '7:00-23:00', sat: '8:00-22:00', sun: '8:00-22:00' },
    medicaidLikely: 0.5,
    freeLikely: 0.1,
    telehealthLikely: 1.0,
    walkinLikely: 0.0,
    languages: ['English', 'Spanish'],
  },
  {
    slug: 'pharmacy',
    namePrefixes: ['Bartell Drugs', 'Rite Aid', 'Walgreens', 'CVS Pharmacy', 'QFC Pharmacy', 'Safeway Pharmacy', 'Fred Meyer Pharmacy', 'Walmart Pharmacy', 'Target Pharmacy', 'Costco Pharmacy', 'Bartell', 'Community Pharmacy', 'Northwest Pharmacy', 'Cascade Pharmacy', 'Evergreen Pharmacy', 'Pacific Pharmacy', 'Olympic Pharmacy', 'Soundview Pharmacy', 'Riverside Pharmacy', 'Valley Pharmacy'],
    nameSuffixes: ['Pharmacy', 'Drug Store', 'Pharmacy & Wellness', 'Pharmacy & Clinic', 'Community Pharmacy'],
    description: 'Full-service pharmacy providing prescriptions, vaccinations, over-the-counter medications, and health consultations.',
    services: ['Prescription filling', 'Vaccinations', 'Medication counseling', 'OTC medications', 'Compounding', 'Health consultations', 'Medication therapy management'],
    costMin: 0,
    costMax: 100,
    hoursDefault: { mon: '9:00-21:00', tue: '9:00-21:00', wed: '9:00-21:00', thu: '9:00-21:00', fri: '9:00-21:00', sat: '9:00-18:00', sun: '10:00-18:00' },
    medicaidLikely: 0.95,
    freeLikely: 0.0,
    telehealthLikely: 0.2,
    walkinLikely: 0.9,
    languages: ['English', 'Spanish'],
  },
  {
    slug: 'womens-health',
    namePrefixes: ['Planned Parenthood', 'Cascadia Women', 'Evergreen Women', 'Cascade Women', 'Pacific Women', 'Olympic Women', 'Soundview Women', 'Northwest Women', 'Salish Women', 'Rainier Women', 'Riverside Women', 'Valley Women', 'Summit Women', 'Heritage Women', 'Greenway Women', 'Belleview Women', 'Sound Women', 'Mountain View Women', 'Sunrise Women'],
    nameSuffixes: ['Women Center', 'OB/GYN', 'Reproductive Health', 'Womens Health', 'Birth Center', 'Prenatal Care', 'Gynecology', 'Womens Care', 'Midwifery'],
    description: 'Women\'s health clinic providing OB/GYN care, reproductive health, prenatal services, and gender-affirming care.',
    services: ['Annual exams', 'Prenatal care', 'Contraception', 'STI testing', 'Gender-affirming care', 'Menopause management', 'Fertility consultation'],
    specialties: ['OB/GYN', 'Midwifery', 'Gynecology', 'Reproductive endocrinology'],
    costMin: 0,
    costMax: 300,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '9:00-18:00', fri: '8:00-17:00', sat: '9:00-15:00', sun: 'Closed' },
    medicaidLikely: 0.8,
    freeLikely: 0.2,
    telehealthLikely: 0.4,
    walkinLikely: 0.2,
    languages: ['English', 'Spanish', 'Vietnamese', 'Amharic'],
    audiences: ['Women', 'Teens', 'LGBTQ+'],
  },
  {
    slug: 'veteran-services',
    namePrefixes: ['VA', 'Veterans Affairs', 'WA Department of Veterans', 'Veterans Support', 'Vet Center', 'Veterans Resource', 'Veterans Community', 'Cascade Veterans', 'Pacific Veterans', 'Salish Veterans', 'Spokane Veterans', 'Olympic Veterans', 'Riverside Veterans', 'Northwest Veterans'],
    nameSuffixes: ['Medical Center', 'Clinic', 'Outpatient Clinic', 'Resource Center', 'Support Services', 'Readjustment Counseling', 'Community Outreach'],
    description: 'Veterans services providing healthcare, mental health support, benefits navigation, and community resources for veterans.',
    services: ['Primary care', 'Mental health services', 'PTSD treatment', 'Benefits navigation', 'Housing assistance', 'Job training', 'Substance use treatment', 'Readjustment counseling'],
    specialties: ['PTSD treatment', 'Military sexual trauma', 'Traumatic brain injury', 'Combat stress'],
    costMin: 0,
    costMax: 50,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-17:00', fri: '8:00-17:00', sat: 'Closed', sun: 'Closed' },
    medicaidLikely: 0.3,
    freeLikely: 0.9,
    telehealthLikely: 0.6,
    walkinLikely: 0.3,
    languages: ['English'],
    audiences: ['Veterans', 'Military families'],
  },
  {
    slug: 'senior-services',
    namePrefixes: ['Senior', 'Elder', 'Aging & Long-Term Care', 'Cascade Senior', 'Pacific Senior', 'Olympic Senior', 'Soundview Senior', 'Riverside Senior', 'Valley Senior', 'Summit Senior', 'Greenway Senior', 'Northwest Senior', 'Salish Senior', 'Rainier Senior', 'Spokane Senior', 'Community Senior', 'Heritage Senior', 'Evergreen Senior', 'Northwest Center', 'Evergreen Center'],
    nameSuffixes: ['Center', 'Services', 'Care Center', 'Adult Day Program', 'Resource Center', 'Community Center', 'Connections', 'Senior Living', 'Assisted Living'],
    description: 'Senior services organization providing care coordination, social programs, meals, and support for older adults and their families.',
    services: ['Case management', 'Adult day programs', 'Meal delivery', 'Transportation', 'Caregiver support', 'Benefits counseling', 'Health & wellness', 'Social activities'],
    costMin: 0,
    costMax: 200,
    hoursDefault: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-17:00', fri: '8:00-17:00', sat: 'Closed', sun: 'Closed' },
    medicaidLikely: 0.4,
    freeLikely: 0.6,
    telehealthLikely: 0.2,
    walkinLikely: 0.3,
    languages: ['English', 'Spanish', 'Russian', 'Korean', 'Vietnamese'],
    audiences: ['Seniors', 'Caregivers'],
  },
];

// ===== Photo URLs (real healthcare photos from Pexels) =====
const PHOTOS = {
  hospital: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800',
  primaryCare: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
  urgentCare: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
  specialist: 'https://images.pexels.com/photos/4225920/pexels-photo-4225920.jpeg?auto=compress&cs=tinysrgb&w=800',
  dental: 'https://images.pexels.com/photos/6642765/pexels-photo-6642765.jpeg?auto=compress&cs=tinysrgb&w=800',
  mentalHealth: 'https://images.pexels.com/photos/6678075/pexels-photo-6678075.jpeg?auto=compress&cs=tinysrgb&w=800',
  substanceUse: 'https://images.pexels.com/photos/6678075/pexels-photo-6678075.jpeg?auto=compress&cs=tinysrgb&w=800',
  communityOrg: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
  foodBank: 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800',
  transportation: 'https://images.pexels.com/photos/4488636/pexels-photo-4488636.jpeg?auto=compress&cs=tinysrgb&w=800',
  insurance: 'https://images.pexels.com/photos/6863251/pexels-photo-6863251.jpeg?auto=compress&cs=tinysrgb&w=800',
  telehealth: 'https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=800',
  pharmacy: 'https://images.pexels.com/photos/5938570/pexels-photo-5938570.jpeg?auto=compress&cs=tinysrgb&w=800',
  womensHealth: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
  veteran: 'https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=800',
  senior: 'https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const PHOTO_MAP: Record<string, string> = {
  'hospital': PHOTOS.hospital,
  'emergency-department': PHOTOS.hospital,
  'primary-care': PHOTOS.primaryCare,
  'urgent-care': PHOTOS.primaryCare,
  'specialist': PHOTOS.specialist,
  'dental': PHOTOS.dental,
  'mental-health': PHOTOS.mentalHealth,
  'crisis-line': PHOTOS.mentalHealth,
  'substance-use': PHOTOS.substanceUse,
  'free-clinic': PHOTOS.primaryCare,
  'fqhc': PHOTOS.primaryCare,
  'community-org': PHOTOS.communityOrg,
  'food-bank': PHOTOS.foodBank,
  'transportation': PHOTOS.transportation,
  'insurance-assistance': PHOTOS.insurance,
  'telehealth': PHOTOS.telehealth,
  'pharmacy': PHOTOS.pharmacy,
  'womens-health': PHOTOS.womensHealth,
  'veteran-services': PHOTOS.veteran,
  'senior-services': PHOTOS.senior,
};

// ===== Languages pool for extra variety =====
const EXTRA_LANGUAGES = ['Vietnamese', 'Mandarin', 'Cantonese', 'Korean', 'Tagalog', 'Amharic', 'Somali', 'Russian', 'Ukrainian', 'Mixteco', 'Triqui', 'Mam', 'Marshallese', 'Ilocano', 'Khmer', 'Punjabi', 'Hindi', 'Arabic', 'Farsi', 'Dari', 'Oromo', 'Tigrinya'];

// ===== Generator =====
function rand(seed: { v: number }): number {
  seed.v = (seed.v * 9301 + 49297) % 233280;
  return seed.v / 233280;
}
function pick<T>(arr: T[], seed: { v: number }): T {
  return arr[Math.floor(rand(seed) * arr.length)];
}
function maybe(prob: number, seed: { v: number }): boolean {
  return rand(seed) < prob;
}

const seed = { v: 42 };
const resources: any[] = [];
const seenNames = new Set<string>();

// Generate resources for each category across all cities
// Target distribution to reach ~1,500+ total:
// - hospital: ~80
// - emergency-department: ~50 (hospitals have EDs)
// - primary-care: ~250
// - urgent-care: ~120
// - specialist: ~200
// - dental: ~150
// - mental-health: ~150
// - substance-use: ~80
// - community-org: ~120
// - food-bank: ~120
// - transportation: ~80
// - insurance-assistance: ~60
// - telehealth: ~50
// - pharmacy: ~120
// - womens-health: ~60
// - veteran-services: ~40
// - senior-services: ~40
// Total: ~1,770

const CATEGORY_COUNTS: Record<string, number> = {
  'primary-care': 4,
  'hospital': 1,
  'urgent-care': 2,
  'specialist': 3,
  'dental': 2,
  'mental-health': 2,
  'substance-use': 1,
  'community-org': 2,
  'food-bank': 2,
  'transportation': 1,
  'insurance-assistance': 1,
  'telehealth': 1,
  'pharmacy': 2,
  'womens-health': 1,
  'veteran-services': 1,
  'senior-services': 1,
};

for (const city of WA_CITIES) {
  for (const [slug, perCity] of Object.entries(CATEGORY_COUNTS)) {
    const template = TEMPLATES.find(t => t.slug === slug);
    if (!template) continue;

    for (let i = 0; i < perCity; i++) {
      const prefix = pick(template.namePrefixes, seed);
      const suffix = pick(template.nameSuffixes, seed);
      let name = `${prefix} ${suffix}`;
      
      // Avoid duplicates — add city qualifier
      if (seenNames.has(name)) {
        name = `${prefix} ${city.city} ${suffix}`;
      }
      if (seenNames.has(name)) {
        name = `${prefix} ${city.city} ${suffix} #${i + 1}`;
      }
      seenNames.add(name);

      // Determine subcategory / specialty
      let subcategory = '';
      let specialties: string[] = [];
      if (template.specialties && template.specialties.length > 0) {
        const specialty = pick(template.specialties, seed);
        subcategory = specialty;
        specialties = [specialty];
        if (slug === 'specialist' || slug === 'dental' || slug === 'mental-health' || slug === 'womens-health' || slug === 'veteran-services') {
          // For specialist categories, the name often reflects the specialty
          if (maybe(0.4, seed)) {
            name = `${prefix} ${specialty}`;
          }
        }
      }

      // Geocoordinate with small jitter for nearby facilities
      const lat = city.lat + (rand(seed) - 0.5) * 0.05;
      const lng = city.lng + (rand(seed) - 0.5) * 0.06;

      // Street address
      const streetNum = Math.floor(rand(seed) * 9000) + 100;
      const streetNames = ['Main St', '1st Ave', '2nd Ave', '3rd St', '4th St', '5th Ave', 'Broadway', 'Pioneer Way', 'Cedar St', 'Maple St', 'Pine St', 'Oak St', 'Hill Ave', 'Park Ave', 'River Rd', 'Sunset Blvd', 'Highland Ave', 'Valley Rd', 'Ridge Ave', 'Summit Dr', 'Cascade Dr', 'Evergreen Way', 'Pacific Hwy', 'University Way', 'College St', 'Hospital Dr', 'Medical Center Dr', 'Health Pkwy', 'Wellness Way', 'Clinic Rd'];
      const address = `${streetNum} ${pick(streetNames, seed)}`;

      // Phone
      const phoneNum = `${city.areaCode}-${Math.floor(rand(seed) * 900) + 100}-${Math.floor(rand(seed) * 9000) + 1000}`;
      
      // Website
      const websiteSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const website = `https://www.${websiteSlug}.com`;

      // Email
      const email = `info@${websiteSlug}.com`;

      // Languages — pick base + maybe extras
      let resourceLanguages = [...template.languages];
      if (maybe(0.3, seed)) {
        const extraLang = pick(EXTRA_LANGUAGES, seed);
        if (!resourceLanguages.includes(extraLang)) {
          resourceLanguages.push(extraLang);
        }
      }
      if (maybe(0.15, seed)) {
        const extraLang2 = pick(EXTRA_LANGUAGES, seed);
        if (!resourceLanguages.includes(extraLang2)) {
          resourceLanguages.push(extraLang2);
        }
      }

      // Insurance flags
      const medicaid = maybe(template.medicaidLikely, seed);
      const medicare = maybe(0.7, seed);
      const privateInsurance = maybe(0.85, seed);
      const uninsured = maybe(template.medicaidLikely > 0.5 ? 0.6 : 0.3, seed);
      const slidingScale = maybe(0.4, seed);
      const free = maybe(template.freeLikely, seed);
      const telehealth = maybe(template.telehealthLikely, seed);
      const walkIns = maybe(template.walkinLikely, seed);
      const appointments = maybe(0.9, seed);

      // Cost — adjust if free
      let costMin = template.costMin;
      let costMax = template.costMax;
      if (free) {
        costMin = 0;
        costMax = 0;
      }

      // Services (subset)
      const services: string[] = [];
      for (const svc of template.services) {
        if (maybe(0.7, seed)) services.push(svc);
      }

      // Accessibility features
      const accessibility: string[] = ['wheelchair'];
      if (maybe(0.6, seed)) accessibility.push('ADA parking');
      if (maybe(0.4, seed)) accessibility.push('interpreter services');
      if (maybe(0.3, seed)) accessibility.push('language services');
      if (maybe(0.2, seed)) accessibility.push('TTY');
      if (maybe(0.25, seed)) accessibility.push('accessible restroom');

      // Audiences
      let audiences = template.audiences ?? ['Adults', 'Families'];
      
      // Rating — bias towards 4.0-4.8
      const ratingBase = 3.8 + rand(seed) * 1.0;
      const rating = Math.round(ratingBase * 10) / 10;

      const photoUrl = PHOTO_MAP[slug] ?? PHOTOS.primaryCare;

      resources.push({
        name,
        category_slug: slug,
        subcategory,
        description: template.description,
        address,
        city: city.city,
        county: city.county,
        state: 'WA',
        zip_code: city.zip,
        latitude: lat,
        longitude: lng,
        phone: phoneNum,
        website,
        email,
        hours: template.hoursDefault,
        accepts_uninsured: uninsured,
        sliding_scale: slidingScale,
        medicaid,
        medicare,
        private_insurance: privateInsurance,
        walk_ins_welcome: walkIns,
        appointments,
        telehealth: telehealth,
        cost_free: free,
        cost_estimate_min: costMin,
        cost_estimate_max: costMax,
        languages: resourceLanguages,
        accessibility,
        services,
        specialties,
        audiences,
        rating,
        photo_url: photoUrl,
      });
    }
  }
}

// ===== Output SQL =====
const lines: string[] = [];
lines.push('-- FindCare bulk resource seed data');
lines.push(`-- Total resources: ${resources.length}`);

// Build in batches of 50 for safety
const BATCH = 50;
for (let i = 0; i < resources.length; i += BATCH) {
  const batch = resources.slice(i, i + BATCH);
  const values = batch.map(r => {
    const esc = (s: string) => s.replace(/'/g, "''");
    const arr = (a: string[]) => `'{${a.map(s => s.replace(/'/g, "''")).join(',')}}'`;
    return `('${esc(r.name)}', (SELECT id FROM resource_categories WHERE slug='${r.category_slug}'), '${esc(r.subcategory)}', '${esc(r.description)}', '${esc(r.address)}', '${esc(r.city)}', '${esc(r.county)}', 'WA', '${r.zip_code}', ${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}, '${r.phone}', '${r.website}', '${r.email}', '${JSON.stringify(r.hours).replace(/'/g, "''")}'::jsonb, ${r.accepts_uninsured}, ${r.sliding_scale}, ${r.medicaid}, ${r.medicare}, ${r.private_insurance}, ${r.walk_ins_welcome}, ${r.appointments}, ${r.telehealth}, ${r.cost_free}, ${r.cost_estimate_min}, ${r.cost_estimate_max}, ${arr(r.languages)}, ${arr(r.accessibility)}, ${arr(r.services)}, ${arr(r.specialties)}, ${arr(r.audiences)}, ${r.rating}, '${r.photo_url}')`;
  });
  lines.push(`INSERT INTO resources (name, category_id, subcategory, description, address, city, county, state, zip_code, latitude, longitude, phone, website, email, hours, accepts_uninsured, sliding_scale, medicaid, medicare, private_insurance, walk_ins_welcome, appointments, telehealth, cost_free, cost_estimate_min, cost_estimate_max, languages, accessibility, services, specialties, audiences, rating, photo_url) VALUES ${values.join(',\n')} ON CONFLICT DO NOTHING;`);
}

console.log(lines.join('\n'));
console.error(`\n[generated ${resources.length} resources in ${Math.ceil(resources.length / BATCH)} batches]`);

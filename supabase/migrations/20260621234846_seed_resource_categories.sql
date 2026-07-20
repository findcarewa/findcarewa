INSERT INTO resource_categories (name, slug, icon, color, sort_order) VALUES
('Hospitals', 'hospital', 'Building2', 'rose', 1),
('Primary Care', 'primary-care', 'Stethoscope', 'sky', 2),
('FQHC', 'fqhc', 'HeartPulse', 'emerald', 3),
('Mental Health', 'mental-health', 'Brain', 'violet', 4),
('Substance Use', 'substance-use', 'Pill', 'amber', 5),
('Dental', 'dental', 'Smile', 'cyan', 6),
('Crisis Lines', 'crisis-line', 'PhoneCall', 'red', 7),
('Community Resources', 'community-org', 'Users', 'blue', 8),
('Food Banks', 'food-bank', 'UtensilsCrossed', 'green', 9),
('Transportation', 'transportation', 'Car', 'teal', 10),
('Veterans Services', 'veterans', 'Shield', 'indigo', 11),
('Pediatrics', 'pediatrics', 'Baby', 'pink', 12),
('Pharmacies', 'pharmacy', 'Pill', 'teal', 13),
('Legal Aid', 'legal-aid', 'Scale', 'slate', 14)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

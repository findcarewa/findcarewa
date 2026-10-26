-- Fix resources with mistracked hours
-- 50 resources had 5+ days marked 'closed' when they should be open M-F
-- Categories: M-F text in hours, business-type orgs (clinics/DSHS/WIC/etc),
-- and long descriptive text that was misparsed into wrong day fields

-- Boys and Girls Clubs - RMAC Branch at Raj Manhas Activity Center - Clu (Olympia)
UPDATE resources SET hours = '{"mon": "2pm-6pm", "tue": "2pm-6pm", "wed": "2pm-6pm", "thu": "2pm-6pm", "fri": "2pm-6pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '7b8568c2-15b1-521f-a751-35c4c72ae808';

-- Boys and Girls Clubs - Tenino Branch - Clubs and Activities (Tenino)
UPDATE resources SET hours = '{"mon": "2pm-6pm", "tue": "2pm-6pm", "wed": "2pm-6pm", "thu": "2pm-6pm", "fri": "2pm-6pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '293d304c-856a-5484-b292-e113b9c538f5';

-- Boys and Girls Clubs - Tumwater Branch - Clubs and Activities (Tumwater)
UPDATE resources SET hours = '{"mon": "2pm-6pm", "tue": "2pm-6pm", "wed": "2pm-6pm", "thu": "2pm-6pm", "fri": "2pm-6pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '22aee464-fc90-5b08-836d-ed3e10e771ef';

-- Bremerton Family YMCA - Membership (Bremerton)
UPDATE resources SET hours = '{"mon": "7am-6pm", "tue": "7am-6pm", "wed": "7am-6pm", "thu": "7am-6pm", "fri": "7am-6pm", "sat": "7am-6pm", "sun": "8am-4pm"}'::jsonb WHERE id = '241cb307-4538-5774-bafb-2d2335b24ac4';

-- Burien Parks, Recreation & Cultural Services - Adult and Senior Progra (Burien)
UPDATE resources SET hours = '{"mon": "9am-5pm", "tue": "9am-5pm", "wed": "9am-5pm", "thu": "9am-5pm", "fri": "9am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '8b51ec6f-dfb2-5b33-bbb0-5a2f59153bce';

-- Clallam County Public Health Services - Forks - Communicable Diseases  (Forks)
UPDATE resources SET hours = '{"mon": "8am-12pm, 12:30pm-4:30pm", "tue": "8am-12pm, 12:30pm-4:30pm", "wed": "8am-12pm, 12:30pm-4:30pm", "thu": "8am-12pm, 12:30pm-4:30pm", "fri": "8am-12pm, 12:30pm-4:30pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'd95d9f1f-5e89-537e-97ba-63493bcf3445';

-- Community Action Center of Whitman County - Food Bank (Pullman)
UPDATE resources SET hours = '{"mon": "10am-1pm", "tue": "10am-1pm", "wed": "10am-1pm", "thu": "10am-1pm", "fri": "10am-1pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '8a4ca90e-8fed-523d-bd76-e0a470c478ac';

-- Confederated Tribes of the Colville Reservation at Inchelium Tribal He (Inchelium)
UPDATE resources SET hours = '{"mon": "10am-2pm", "tue": "10am-2pm", "wed": "10am-2pm", "thu": "10am-2pm", "fri": "10am-2pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '3d489ccb-f6ee-5cb5-a954-2ca31b4ead2c';

-- Cowlitz Family Health Center in Woodland - WIC (Woodland)
UPDATE resources SET hours = '{"mon": "8am-7pm", "tue": "8am-7pm", "wed": "8am-7pm", "thu": "8am-7pm", "fri": "8am-7pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'a7f13e7b-c4ff-5b04-88c8-5c5335009a2b';

-- DSHS Developmental Disabilities Administration''s Kelso Field Office - (Statewide)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '921c9a07-e39f-5263-a0e8-e8191c296ea2';

-- DSHS Developmental Disabilities Administration''s Shelton Field Office (Statewide)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'f115093d-da7e-5932-b6f3-efb95fb3c0ce';

-- Family Health Centers at Room One in Twisp - WIC (Twisp)
UPDATE resources SET hours = '{"mon": "8:30am-5pm", "tue": "8:30am-5pm", "wed": "8:30am-5pm", "thu": "8:30am-5pm", "fri": "8:30am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'bc0a1422-6b01-5645-9416-b5dc0173a889';

-- Family Health Centers in Bridgeport - WIC (Bridgeport)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '6691cb34-5c79-51de-b520-b36e85385c9a';

-- FISH of Cowlitz County - Food and Emergency Financial Support (Statewide)
UPDATE resources SET hours = '{"mon": "9am-4pm", "tue": "9am-4pm", "wed": "9am-4pm", "thu": "9am-4pm", "fri": "9am-4pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '3f54e7cf-2fe9-5197-a043-52039fc82da9';

-- Gather Church - Harm Reduction/Meds First - Harm Reduction/Meds First (Centralia)
UPDATE resources SET hours = '{"mon": "4pm-7pm", "tue": "4pm-7pm", "wed": "4pm-7pm", "thu": "4pm-7pm", "fri": "4pm-7pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '8af29dda-de1a-5660-ad53-e3e85c0345fc';

-- Gordon Family YMCA - Membership (Sumner)
UPDATE resources SET hours = '{"mon": "8am-4pm", "tue": "8am-4pm", "wed": "8am-4pm", "thu": "8am-4pm", "fri": "8am-4pm", "sat": "8am-4pm", "sun": "closed"}'::jsonb WHERE id = 'e138f38b-a959-5d1f-8f82-da584c00f047';

-- Hand In Hand Immigration Services - Immigration Legal Services (Wenatchee)
UPDATE resources SET hours = '{"mon": "1pm-6pm", "tue": "1pm-6pm", "wed": "1pm-6pm", "thu": "1pm-6pm", "fri": "1pm-6pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '079c1fcb-9145-540d-b66a-f21da1d5848e';

-- HealthPoint''s Bothell Clinic - WIC (Bothell)
UPDATE resources SET hours = '{"mon": "8am-6pm", "tue": "8am-6pm", "wed": "8am-6pm", "thu": "8am-6pm", "fri": "8am-6pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '92e74087-76d4-5f8d-ac0e-5734a475a898';

-- Helping Hands Food Bank in Anacortes - Food Distribution (Anacortes)
UPDATE resources SET hours = '{"mon": "closed", "tue": "11am-2pm", "wed": "closed", "thu": "closed", "fri": "closed", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '4b3704d1-aa2a-5317-b357-13eea856c03b';

-- Helping Hands Food Bank in Marblemount - Food Distribution (Marblemount)
UPDATE resources SET hours = '{"mon": "closed", "tue": "closed", "wed": "11am-2pm", "thu": "closed", "fri": "closed", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '88397b56-2e8a-58e4-aa72-595ff1e61039';

-- Intercity Transit - Dial-A-Lift (Olympia)
UPDATE resources SET hours = '{"mon": "8:30am-11pm", "tue": "8:30am-11pm", "wed": "8:30am-11pm", "thu": "8:30am-11pm", "fri": "8:30am-11pm", "sat": "8:30am-11pm", "sun": "8:30am-11pm"}'::jsonb WHERE id = 'fc5d282d-d5c6-5c66-9798-dd5694c6ccad';

-- Kent Parks, Recreation & Community Services at Meridian Middle School  (Kent)
UPDATE resources SET hours = '{"mon": "5:30-9pm", "tue": "5:30-9pm", "wed": "5:30-9pm", "thu": "5:30-9pm", "fri": "5:30-9pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '4170d5e7-45c1-5122-9c8d-43f8cce5ac38';

-- Lewis County Transit - Fixed Route Bus Service (Centralia)
UPDATE resources SET hours = '{"mon": "8am-6pm", "tue": "8am-6pm", "wed": "8am-6pm", "thu": "8am-6pm", "fri": "8am-6pm", "sat": "8am-6pm", "sun": "8am-6pm"}'::jsonb WHERE id = 'e104821f-ddeb-5b6f-afd9-82a6646ca527';

-- Lifeline Connections in Concrete - MOUD Services (Concrete)
UPDATE resources SET hours = '{"mon": "closed", "tue": "10am-3pm", "wed": "closed", "thu": "closed", "fri": "closed", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'd5bbfd8b-1f79-596a-8eea-a17cc8057b25';

-- Moses Lake Community Health Center - WIC (Warden) (Warden)
UPDATE resources SET hours = '{"mon": "8:30am-4:30pm", "tue": "8:30am-4:30pm", "wed": "8:30am-4:30pm", "thu": "8:30am-4:30pm", "fri": "8:30am-4:30pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '7f67981a-d790-4038-beca-54fd1ccf213d';

-- Neighborcare Health''s Meridian Clinic - General Medical Care (Seattle)
UPDATE resources SET hours = '{"mon": "closed", "tue": "closed", "wed": "1st & 3rd, 9:30am-4:30pm", "thu": "closed", "fri": "closed", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '787b51ce-a5e0-5cdd-aa39-b89179849ea0';

-- Neighborcare Health''s Meridian Clinic - Medication for Opioid Use Dis (Seattle)
UPDATE resources SET hours = '{"mon": "closed", "tue": "closed", "wed": "1st & 3rd, 9:30am-4:30pm", "thu": "closed", "fri": "closed", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '9f128fa3-1f61-50df-8406-d8156607543b';

-- Neighborcare Health''s Pike Place Market Clinic - Adult Medical Care (Seattle)
UPDATE resources SET hours = '{"mon": "8am-4pm", "tue": "8am-4pm", "wed": "8am-4pm", "thu": "8am-4pm", "fri": "8am-4pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'f24de8db-a0c7-5af8-8114-3c2c1eda6abe';

-- Neighborcare Health''s Pike Place Market Clinic - Medication for Opioi (Seattle)
UPDATE resources SET hours = '{"mon": "8am-4pm", "tue": "8am-4pm", "wed": "8am-4pm", "thu": "8am-4pm", "fri": "8am-4pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'd5fade45-655a-590a-8b0a-14c7c6dd795a';

-- Northwest Kidney Center Everett - Patient Services (Everett)
UPDATE resources SET hours = '{"mon": "5am-11:30pm", "tue": "5am-11:30pm", "wed": "5am-11:30pm", "thu": "5am-11:30pm", "fri": "5am-11:30pm", "sat": "5am-11:30pm", "sun": "closed"}'::jsonb WHERE id = '8f19823b-5ff7-5645-aae2-75cc34a738ee';

-- Northwest Kidney Center Renton - Patient Services (Renton)
UPDATE resources SET hours = '{"mon": "5am-11:30pm", "tue": "5am-11:30pm", "wed": "5am-11:30pm", "thu": "5am-11:30pm", "fri": "5am-11:30pm", "sat": "5am-11:30pm", "sun": "closed"}'::jsonb WHERE id = '42fe8c64-c778-5ee5-bc9f-9820e4a15495';

-- Nourish Pierce County University of Washington Tacoma - Mobile Food Ba (Tacoma)
UPDATE resources SET hours = '{"mon": "4:30pm-6:30pm", "tue": "4:30pm-6:30pm", "wed": "4:30pm-6:30pm", "thu": "4:30pm-6:30pm", "fri": "4:30pm-6:30pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '4bd8e07f-fab9-597b-8499-334ffd2a50a8';

-- Overlake Medical Clinic in Sammamish - Urgent Care (Sammamish)
UPDATE resources SET hours = '{"mon": "11am-9pm", "tue": "11am-9pm", "wed": "11am-9pm", "thu": "11am-9pm", "fri": "11am-9pm", "sat": "11am-9pm", "sun": "11am-9pm"}'::jsonb WHERE id = '47d3d86a-e803-5df2-b604-a1ccd1422f73';

-- Public Health in Seattle & King County at Enumclaw Satellite WIC Offic (Enumclaw)
UPDATE resources SET hours = '{"mon": "8:30am-noon, 1-5pm", "tue": "8:30am-noon, 1-5pm", "wed": "8:30am-noon, 1-5pm", "thu": "8:30am-noon, 1-5pm", "fri": "8:30am-noon, 1-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'd2dfc0fb-5e27-553c-ab96-88477fffa4d2';

-- Public Health in Seattle & King County at Skyway Resource Center - WIC (Seattle)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '8dc44b2c-cd60-5c1d-8686-37b1a4063ac6';

-- Sea Mar Community Health Centers in Concrete - Medical Care (Concrete)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'df124a76-1436-5e0a-9976-ad7cedef695d';

-- Sea Mar Community Health Centers in Elma - WIC (Women, Infants and Chi (Elma)
UPDATE resources SET hours = '{"mon": "9am-4pm", "tue": "9am-4pm", "wed": "9am-4pm", "thu": "9am-4pm", "fri": "9am-4pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'eeb671a6-1ba1-5781-a6e0-3e267d0a1589';

-- Sea Mar Community Health Centers in Puyallup - Maternity Support (Puyallup)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '826d1726-8f74-5175-b421-a1e774c59663';

-- University of Washington Hall Health Center - OB/GYN Clinic (Seattle)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'c9f4fa09-ff53-58f2-9623-f382b1b97e45';

-- University of Washington Hall Health Center - Physical Therapy and Spo (Seattle)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '84530c68-d54a-5b36-bf7a-1c7671d33b30';

-- University of Washington Hall Health Center - Primary Care Clinic (Seattle)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '7efc5e8d-cacd-5455-89b2-350d0d04bdc6';

-- University of Washington Medical Center - Roosevelt - General Internal (Seattle)
UPDATE resources SET hours = '{"mon": "9am-5pm", "tue": "9am-5pm", "wed": "9am-5pm", "thu": "9am-5pm", "fri": "9am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'b70906f9-a72c-52c2-a2b1-b09fbd3355ee';

-- University of Washington Medical Center''s Northwest Campus at Main Ca (Seattle)
UPDATE resources SET hours = '{"mon": "8am-7pm", "tue": "8am-7pm", "wed": "8am-7pm", "thu": "8am-7pm", "fri": "8am-7pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'ffeb77d9-5121-5b94-86e6-2c453600f604';

-- UW Medicine''s Ballard Clinic - Primary Care (Seattle)
UPDATE resources SET hours = '{"mon": "8am-7pm", "tue": "8am-7pm", "wed": "8am-7pm", "thu": "8am-7pm", "fri": "8am-7pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '617cc1e6-656e-5e47-aaf5-45bb554cde71';

-- Valley Cities in Enumclaw - WIC Program (Enumclaw)
UPDATE resources SET hours = '{"mon": "8am-5pm", "tue": "8am-5pm", "wed": "8am-5pm", "thu": "8am-5pm", "fri": "8am-5pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'f76bc174-0ad3-5550-8e02-5cc58604e066';

-- Valley Transit - Evening and Saturday Flex Route Service (Walla Walla)
UPDATE resources SET hours = '{"mon": "10:45am-6:10pm", "tue": "10:45am-6:10pm", "wed": "10:45am-6:10pm", "thu": "10:45am-6:10pm", "fri": "10:45am-6:10pm", "sat": "10:45am-6:10pm", "sun": "10:45am-6:10pm"}'::jsonb WHERE id = '95e0cb86-1bb9-5b24-888a-f2de91669590';

-- Wahkiakum County Health & Human Services at Johnson Park - WIC Supplem (Rosburg)
UPDATE resources SET hours = '{"mon": "11am-3pm", "tue": "11am-3pm", "wed": "11am-3pm", "thu": "11am-3pm", "fri": "11am-3pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '5ac137f2-31fb-54aa-b3ce-3d56df287079';

-- West Central Community Center at The Heights Church - Women, Infants,  (Airway Heights)
UPDATE resources SET hours = '{"mon": "9:30am-4pm", "tue": "9:30am-4pm", "wed": "9:30am-4pm", "thu": "9:30am-4pm", "fri": "9:30am-4pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '24dd920e-7fc0-5a4e-9c04-6a961802cafc';

-- WorkSource Pierce County South Hill - Job Center (Puyallup)
UPDATE resources SET hours = '{"mon": "10am-2pm", "tue": "10am-2pm", "wed": "10am-2pm", "thu": "10am-2pm", "fri": "10am-2pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = 'c4d43563-0bf4-5da0-a6af-5f42817c91ad';

-- YMCA - University Y Student Center - Membership (Tacoma)
UPDATE resources SET hours = '{"mon": "7am-6pm", "tue": "7am-6pm", "wed": "7am-6pm", "thu": "7am-6pm", "fri": "7am-6pm", "sat": "closed", "sun": "closed"}'::jsonb WHERE id = '42414a0d-90f5-5590-a9b7-d5560d2653ac';

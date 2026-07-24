/*
# Seed initial symptom catalog

Inserts 12 common symptoms with full data (keywords, specialties, urgency,
recommended care types, category slugs, FAQs, and trusted medical sources).
These cover cardiac, respiratory, mental health, dental, dermatology, vision,
and general primary care scenarios to demonstrate the data model across
urgency levels from "low" to "emergency".

## Symptoms added:
1. Chest Pain (emergency, red flag)
2. Shortness of Breath (emergency, red flag)
3. Pink Eye (moderate)
4. Toothache (moderate)
5. Anxiety (moderate)
6. Depression (moderate)
7. Suicidal Thoughts (emergency, red flag)
8. Rash (low)
9. Fever (moderate)
10. Sore Throat (low)
11. Ear Infection (moderate)
12. Nausea and Vomiting (moderate)

Each symptom includes 2-3 FAQ entries and 2-3 trusted medical source citations
from CDC, Mayo Clinic, NIH, SAMHSA, and other authoritative sources.
*/

-- Helper: insert symptom and return its id via a CTE for child inserts
WITH inserted_symptoms AS (
  INSERT INTO symptoms (name, slug, description, keywords, specialties, urgency, recommended_care_types, category_slugs, red_flag, sort_order)
  VALUES
  -- 1. Chest Pain
  (
    'Chest Pain',
    'chest-pain',
    'Chest pain can signal a heart attack or other serious cardiac condition. It may feel like pressure, tightness, squeezing, or a crushing sensation. Pain may radiate to the arm, jaw, neck, or back. Seek emergency care immediately if chest pain is severe, persistent, or accompanied by shortness of breath, sweating, nausea, or fainting.',
    ARRAY['chest pain','chest tightness','chest pressure','heart pain','cardiac pain','chest discomfort','crushing chest','tight chest'],
    ARRAY['cardiology','emergency medicine'],
    'emergency',
    ARRAY['emergency-room','urgent-care'],
    ARRAY['hospital','crisis-line'],
    true,
    1
  ),
  -- 2. Shortness of Breath
  (
    'Shortness of Breath',
    'shortness-of-breath',
    'Shortness of breath (dyspnea) is the feeling of not getting enough air. It can result from asthma, COPD, heart problems, anxiety, infections like pneumonia, or allergic reactions. Seek emergency care if breathing difficulty is sudden, severe, or accompanied by chest pain, blue lips, swelling of the throat, or confusion.',
    ARRAY['shortness of breath','breathing difficulty','cant breathe','breathless','dyspnea','wheezing','trouble breathing','gasping'],
    ARRAY['pulmonology','cardiology','emergency medicine'],
    'emergency',
    ARRAY['emergency-room','urgent-care'],
    ARRAY['hospital','primary-care'],
    true,
    2
  ),
  -- 3. Pink Eye
  (
    'Pink Eye',
    'pink-eye',
    'Pink eye (conjunctivitis) is inflammation of the conjunctiva, the thin clear tissue lining the inside of the eyelid and covering the white of the eye. It can be caused by viruses, bacteria, allergens, or irritants. Symptoms include redness, itching, tearing, discharge, and crusting of the eyelids. Most cases are mild and resolve on their own, but bacterial conjunctivitis may need antibiotic drops.',
    ARRAY['pink eye','red eye','eye infection','conjunctivitis','eye discharge','crusty eyes','itchy eyes','watery eyes'],
    ARRAY['ophthalmology','optometry','primary care'],
    'moderate',
    ARRAY['primary-care','urgent-care'],
    ARRAY['primary-care'],
    false,
    3
  ),
  -- 4. Toothache
  (
    'Toothache',
    'toothache',
    'A toothache is pain in or around a tooth. It can be caused by tooth decay, a cracked tooth, gum disease, an abscess, or exposed tooth roots. Symptoms range from mild sensitivity to severe, throbbing pain. See a dentist promptly if pain is severe, accompanied by swelling, fever, or difficulty breathing or swallowing.',
    ARRAY['toothache','tooth pain','dental pain','cavity','bad tooth','sore tooth','tooth infection','dental abscess','broken tooth'],
    ARRAY['dentistry','oral surgery','endodontics'],
    'moderate',
    ARRAY['urgent-care','primary-care'],
    ARRAY['dental'],
    false,
    4
  ),
  -- 5. Anxiety
  (
    'Anxiety',
    'anxiety',
    'Anxiety is a feeling of worry, nervousness, or unease that can be mild or severe. When anxiety is persistent or overwhelming, it may indicate an anxiety disorder. Symptoms include restlessness, racing thoughts, rapid heartbeat, sweating, trouble concentrating, sleep problems, and panic attacks. Treatment options include therapy, medication, and lifestyle changes.',
    ARRAY['anxiety','anxious','panic','worry','nervous','stress','panic attack','generalized anxiety','racing thoughts','on edge'],
    ARRAY['psychiatry','psychology','counseling','primary care'],
    'moderate',
    ARRAY['primary-care','telehealth'],
    ARRAY['mental-health','crisis-line'],
    false,
    5
  ),
  -- 6. Depression
  (
    'Depression',
    'depression',
    'Depression (major depressive disorder) is a mood disorder that causes persistent feelings of sadness, hopelessness, and loss of interest in activities. It affects how you feel, think, and handle daily activities. Symptoms include low mood, fatigue, changes in appetite or sleep, difficulty concentrating, feelings of worthlessness, and in severe cases, thoughts of self-harm. Effective treatments include therapy, medication, and support.',
    ARRAY['depression','depressed','sad','hopeless','low mood','no motivation','empty','worthless','cant enjoy','down'],
    ARRAY['psychiatry','psychology','counseling','primary care'],
    'moderate',
    ARRAY['primary-care','telehealth'],
    ARRAY['mental-health','crisis-line'],
    false,
    6
  ),
  -- 7. Suicidal Thoughts
  (
    'Suicidal Thoughts',
    'suicidal-thoughts',
    'Suicidal thoughts (suicidal ideation) are thoughts of harming or killing oneself. These can range from fleeting thoughts to detailed plans. If you or someone you know is experiencing suicidal thoughts, seek help immediately. Call or text 988 (Suicide & Crisis Lifeline) or go to the nearest emergency room. You are not alone — help is available 24/7.',
    ARRAY['suicidal','suicide','want to die','kill myself','end it all','self harm','no reason to live','suicidal thoughts','suicidal ideation'],
    ARRAY['psychiatry','psychology','crisis intervention'],
    'emergency',
    ARRAY['emergency-room','crisis-line'],
    ARRAY['crisis-line','mental-health','hospital'],
    true,
    7
  ),
  -- 8. Rash
  (
    'Rash',
    'rash',
    'A rash is an area of irritated or swollen skin. It can be caused by allergies, infections, heat, autoimmune conditions, or contact with irritants. Most rashes are mild and resolve on their own, but seek care if a rash is painful, spreading rapidly, accompanied by fever, or shows signs of infection like pus or warmth.',
    ARRAY['rash','skin rash','skin irritation','hives','red skin','itchy skin','dermatitis','eczema','skin bumps','skin reaction'],
    ARRAY['dermatology','primary care'],
    'low',
    ARRAY['primary-care','urgent-care'],
    ARRAY['primary-care'],
    false,
    8
  ),
  -- 9. Fever
  (
    'Fever',
    'fever',
    'A fever is a temporary increase in body temperature, often due to an infection. Normal body temperature is around 98.6°F (37°C); a fever is generally 100.4°F (38°C) or higher. Most fevers are harmless and help the body fight infection. Seek medical care if a fever is very high (above 103°F/39.4°C), lasts more than 3 days, or is accompanied by severe headache, stiff neck, difficulty breathing, or confusion.',
    ARRAY['fever','high temperature','hot','chills','temperature','feverish','running a fever','fever and chills'],
    ARRAY['primary care','infectious disease','pediatrics'],
    'moderate',
    ARRAY['primary-care','urgent-care'],
    ARRAY['primary-care','pediatrics'],
    false,
    9
  ),
  -- 10. Sore Throat
  (
    'Sore Throat',
    'sore-throat',
    'A sore throat is pain, scratchiness, or irritation of the throat that often worsens when you swallow. Most sore throats are caused by viral infections like colds or flu and resolve on their own. Strep throat, a bacterial infection, requires antibiotics. See a provider if a sore throat is severe, lasts longer than a week, or is accompanied by high fever, difficulty swallowing, or difficulty breathing.',
    ARRAY['sore throat','throat pain','scratchy throat','strep','swollen throat','painful swallowing','throat irritation'],
    ARRAY['primary care','otolaryngology'],
    'low',
    ARRAY['primary-care','urgent-care'],
    ARRAY['primary-care'],
    false,
    10
  ),
  -- 11. Ear Infection
  (
    'Ear Infection',
    'ear-infection',
    'An ear infection (otitis media) is an infection of the middle ear, the air-filled space behind the eardrum. It often results from a cold, respiratory infection, or allergy. Symptoms include ear pain, fluid drainage, difficulty hearing, and sometimes fever. Ear infections are common in children. Most resolve on their own, but severe or persistent cases may need antibiotics.',
    ARRAY['ear infection','ear pain','earache','ear pressure','fluid in ear','ear drainage','otitis','middle ear infection'],
    ARRAY['primary care','otolaryngology','pediatrics'],
    'moderate',
    ARRAY['primary-care','urgent-care'],
    ARRAY['primary-care','pediatrics'],
    false,
    11
  ),
  -- 12. Nausea and Vomiting
  (
    'Nausea and Vomiting',
    'nausea-and-vomiting',
    'Nausea is an uneasy feeling in the stomach that often precedes the urge to vomit. Vomiting is the forceful expulsion of stomach contents through the mouth. Common causes include gastroenteritis (stomach flu), food poisoning, motion sickness, pregnancy, and certain medications. Seek care if vomiting is severe, lasts more than 24 hours, shows blood, or is accompanied by severe abdominal pain, dehydration, or high fever.',
    ARRAY['nausea','vomiting','throwing up','sick to stomach','puke','upset stomach','stomach flu','cant keep food down','queasy'],
    ARRAY['primary care','gastroenterology'],
    'moderate',
    ARRAY['primary-care','urgent-care'],
    ARRAY['primary-care'],
    false,
    12
  )
  RETURNING id, slug
)
SELECT 'Symptoms inserted: ' || count(*)::text FROM inserted_symptoms;

-- ===== FAQs =====
-- Insert FAQs using subqueries to find symptom IDs by slug
INSERT INTO symptom_faqs (symptom_id, question, answer, sort_order)
SELECT s.id, q.question, q.answer, q.sort_order
FROM symptoms s
JOIN (VALUES
  ('chest-pain', 'When should I call 911 for chest pain?', 'Call 911 immediately if chest pain is severe, crushing, or squeezing, lasts more than a few minutes, or is accompanied by shortness of breath, sweating, nausea, dizziness, or pain radiating to the arm, jaw, or back. Do not drive yourself.', 1),
  ('chest-pain', 'Can chest pain be something other than a heart attack?', 'Yes. Chest pain can also be caused by acid reflux, muscle strain, anxiety, lung conditions, or rib problems. However, only a medical provider can determine the cause — always err on the side of caution for severe chest pain.', 2),
  ('chest-pain', 'What should I do while waiting for emergency help?', 'Stop all activity, sit or lie down, loosen tight clothing, and stay calm. If you have aspirin and are not allergic, chew a regular-strength aspirin. Do not eat or drink anything else.', 3),

  ('shortness-of-breath', 'When is shortness of breath an emergency?', 'Call 911 if breathing difficulty is sudden or severe, or comes with chest pain, fainting, blue lips or fingers, confusion, or swelling of the lips, tongue, or throat (possible allergic reaction).', 1),
  ('shortness-of-breath', 'What causes shortness of breath?', 'Common causes include asthma, COPD, anxiety, pneumonia, heart failure, anemia, and allergic reactions. A medical provider can determine the cause based on your history and examination.', 2),
  ('shortness-of-breath', 'How is shortness of breath treated?', 'Treatment depends on the cause — inhalers for asthma, oxygen or medications for heart conditions, antibiotics for infections, and anti-anxiety strategies for panic-related breathing issues.', 3),

  ('pink-eye', 'Is pink eye contagious?', 'Viral and bacterial conjunctivitis are highly contagious. Wash hands frequently, avoid touching the eyes, do not share towels or pillowcases, and stay home from school or work until symptoms clear. Allergic conjunctivitis is not contagious.', 1),
  ('pink-eye', 'How long does pink eye last?', 'Viral conjunctivitis typically lasts 1-2 weeks. Bacterial conjunctivitis often improves within 2-5 days with antibiotic drops. Allergic conjunctivitis clears once the allergen is removed or treated.', 2),
  ('pink-eye', 'When should I see a doctor for pink eye?', 'See a provider if you have severe eye pain, vision changes, light sensitivity, intense redness, or symptoms that do not improve after a week. These may indicate a more serious condition.', 3),

  ('toothache', 'When should I see a dentist for a toothache?', 'See a dentist within 1-2 days if you have persistent tooth pain. Seek same-day care if you have severe pain, facial swelling, fever, difficulty breathing or swallowing, or pus around the tooth — these may indicate an abscess.', 1),
  ('toothache', 'What can I do for tooth pain at home?', 'Rinse with warm salt water, apply a cold compress to the cheek, take over-the-counter pain relievers, and avoid very hot, cold, or sweet foods. These are temporary measures — see a dentist for proper treatment.', 2),
  ('toothache', 'Can a tooth infection spread?', 'Yes. Untreated dental infections can spread to the jaw, face, neck, or bloodstream, becoming life-threatening. Signs of spreading infection include swelling, fever, difficulty swallowing, and red streaks on the skin.', 3),

  ('anxiety', 'When should I seek professional help for anxiety?', 'Seek help if anxiety interferes with daily life, relationships, or work, if you have frequent panic attacks, or if you experience physical symptoms like chest pain, rapid heartbeat, or insomnia. A primary care provider or mental health professional can help.', 1),
  ('anxiety', 'What treatments are available for anxiety?', 'Treatment options include cognitive behavioral therapy (CBT), medication (such as SSRIs), lifestyle changes like regular exercise and mindfulness, and support groups. Many people benefit from a combination of approaches.', 2),
  ('anxiety', 'How can I manage anxiety in the moment?', 'Try slow, deep breathing (4-7-8 technique), grounding exercises (name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste), progressive muscle relaxation, or a brief walk. Avoid caffeine and alcohol.', 3),

  ('depression', 'How do I know if I have depression or just sadness?', 'Depression is diagnosed when symptoms (low mood, loss of interest, fatigue, sleep or appetite changes, difficulty concentrating, feelings of worthlessness) persist for at least two weeks and interfere with daily functioning. A healthcare provider can make a proper diagnosis.', 1),
  ('depression', 'What treatments work for depression?', 'Effective treatments include psychotherapy (especially CBT and interpersonal therapy), antidepressant medications, lifestyle changes (exercise, sleep, social connection), and for treatment-resistant cases, newer therapies. Most people improve with treatment.', 2),
  ('depression', 'Is depression a normal part of aging or life?', 'No. While sadness is a normal human emotion, persistent depression that lasts weeks or months is a medical condition, not a character flaw or a normal part of life. It is treatable at any age.', 3),

  ('suicidal-thoughts', 'What should I do if I am having suicidal thoughts?', 'Call or text 988 (Suicide & Crisis Lifeline) right now — it is free, confidential, and available 24/7. If you are in immediate danger, call 911 or go to the nearest emergency room. You can also reach the Crisis Text Line by texting HOME to 741741.', 1),
  ('suicidal-thoughts', 'How can I help someone who is suicidal?', 'Take all threats seriously. Ask directly if they are thinking about suicide. Listen without judgment. Remove access to means. Stay with them and help them call 988 or 911. Never leave a person alone if you believe they are in immediate danger.', 2),
  ('suicidal-thoughts', 'Are suicidal thoughts common?', 'Yes, more common than many realize. Having suicidal thoughts does not mean someone is weak or selfish — it means they are in overwhelming pain. With proper treatment and support, most people who experience suicidal thoughts go on to recover.', 3),

  ('rash', 'When should I see a doctor for a rash?', 'See a provider if a rash is painful, warm to the touch, spreading rapidly, blistering, or accompanied by fever, joint pain, or swelling. Seek emergency care if a rash appears with difficulty breathing or swelling of the face or throat (possible allergic reaction).', 1),
  ('rash', 'What causes rashes?', 'Rashes can be caused by contact with irritants or allergens (poison ivy, soaps), infections (fungus, bacteria, viruses), autoimmune conditions (eczema, psoriasis), heat, medications, or insect bites. Identifying the trigger helps guide treatment.', 2),

  ('fever', 'When is a fever dangerous?', 'Seek emergency care for a fever above 103°F (39.4°C), or any fever with severe headache, stiff neck, confusion, difficulty breathing, repeated vomiting, or a rash that does not fade when pressed. For infants under 3 months, any fever 100.4°F (38°C) or higher requires immediate medical attention.', 1),
  ('fever', 'How can I reduce a fever at home?', 'Stay hydrated, rest, dress in light clothing, keep the room cool, and take acetaminophen or ibuprofen as directed. Do not give aspirin to children or teenagers due to the risk of Reyes syndrome. Lukewarm sponge baths can also help.', 2),
  ('fever', 'Should I always try to bring a fever down?', 'Not necessarily. A mild fever is the body''s natural response to infection and helps fight off illness. Treat for comfort rather than targeting a specific temperature. Focus on staying hydrated and resting.', 3),

  ('sore-throat', 'How do I know if my sore throat is strep?', 'Strep throat often causes severe throat pain, difficulty swallowing, fever, swollen tonsils with white patches, and tender lymph nodes in the neck — but usually NOT a cough or runny nose. A rapid strep test at a clinic can confirm the diagnosis.', 1),
  ('sore-throat', 'How long does a sore throat last?', 'Viral sore throats typically improve within 5-7 days. Strep throat improves within a few days of starting antibiotics. See a provider if a sore throat lasts more than a week, or is accompanied by high fever, difficulty swallowing, or difficulty breathing.', 2),

  ('ear-infection', 'How do I know if I or my child has an ear infection?', 'Common signs include ear pain, tugging at the ear (in young children), fluid draining from the ear, difficulty hearing, fussiness, and sometimes fever. A provider can confirm by examining the eardrum with an otoscope.', 1),
  ('ear-infection', 'Do ear infections always need antibiotics?', 'No. Many ear infections, especially in older children and adults, are viral and resolve on their own. Antibiotics are prescribed for bacterial infections, severe symptoms, or when symptoms persist beyond 2-3 days. Your provider will decide.', 2),
  ('ear-infection', 'How can I relieve ear pain at home?', 'Apply a warm compress to the affected ear, take over-the-counter pain relievers, keep the head elevated, and avoid inserting anything into the ear canal. These are temporary measures — see a provider for persistent or severe pain.', 3),

  ('nausea-and-vomiting', 'When should I seek medical care for vomiting?', 'Seek care if vomiting lasts more than 24 hours, contains blood or material that looks like coffee grounds, is accompanied by severe abdominal pain, high fever, signs of dehydration (dry mouth, no urination, dizziness), or if you cannot keep fluids down for over 12 hours.', 1),
  ('nausea-and-vomiting', 'How can I prevent dehydration when vomiting?', 'Sip small amounts of clear fluids (water, broth, electrolyte solutions) frequently rather than drinking large amounts at once. Avoid solid foods until vomiting stops, then gradually reintroduce bland foods like crackers, rice, and toast (the BRAT diet).', 2),
  ('nausea-and-vomiting', 'What causes nausea and vomiting?', 'Common causes include viral gastroenteritis (stomach flu), food poisoning, motion sickness, pregnancy, medications, migraines, and sometimes more serious conditions like appendicitis or bowel obstruction. A provider can help determine the cause.', 3)
) AS q(slug, question, answer, sort_order)
ON q.slug = s.slug;

-- ===== SOURCES =====
INSERT INTO symptom_sources (symptom_id, title, url, publisher, sort_order)
SELECT s.id, src.title, src.url, src.publisher, src.sort_order
FROM symptoms s
JOIN (VALUES
  ('chest-pain', 'CDC — Heart Attack Signs and Symptoms', 'https://www.cdc.gov/heart-disease/signs-symptoms/index.html', 'CDC', 1),
  ('chest-pain', 'Mayo Clinic — Chest Pain', 'https://www.mayoclinic.org/diseases-conditions/chest-pain/symptoms-causes/syc-20370838', 'Mayo Clinic', 2),
  ('chest-pain', 'American Heart Association — Warning Signs', 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack', 'American Heart Association', 3),

  ('shortness-of-breath', 'Mayo Clinic — Shortness of Breath', 'https://www.mayoclinic.org/symptoms/shortness-of-breath/basics/when-to-see-doctor/sym-20050890', 'Mayo Clinic', 1),
  ('shortness-of-breath', 'NIH — Dyspnea (Shortness of Breath)', 'https://www.nhlbi.nih.gov/health/dyspnea', 'NIH NHLBI', 2),

  ('pink-eye', 'CDC — Conjunctivitis (Pink Eye)', 'https://www.cdc.gov/conjunctivitis/index.html', 'CDC', 1),
  ('pink-eye', 'Mayo Clinic — Pink Eye (Conjunctivitis)', 'https://www.mayoclinic.org/diseases-conditions/pink-eye/symptoms-causes/syc-20376355', 'Mayo Clinic', 2),
  ('pink-eye', 'AAO — Conjunctivitis', 'https://www.aao.org/eye-health/diseases/pink-eye-conjunctivitis', 'American Academy of Ophthalmology', 3),

  ('toothache', 'ADA — Toothache', 'https://www.ada.org/resources/research/science-and-research-institute/oral-health-topics/toothache', 'American Dental Association', 1),
  ('toothache', 'Mayo Clinic — Toothache', 'https://www.mayoclinic.org/diseases-conditions/toothache/symptoms-causes/syc-20371234', 'Mayo Clinic', 2),

  ('anxiety', 'NIMH — Anxiety Disorders', 'https://www.nimh.nih.gov/health/topics/anxiety-disorders', 'NIMH', 1),
  ('anxiety', 'Mayo Clinic — Anxiety Disorders', 'https://www.mayoclinic.org/diseases-conditions/anxiety-disorders/symptoms-causes/syc-20350961', 'Mayo Clinic', 2),
  ('anxiety', 'ADAA — Anxiety and Depression', 'https://adaa.org/understanding-anxiety', 'Anxiety & Depression Association of America', 3),

  ('depression', 'NIMH — Depression', 'https://www.nimh.nih.gov/health/topics/depression', 'NIMH', 1),
  ('depression', 'Mayo Clinic — Depression (Major Depressive Disorder)', 'https://www.mayoclinic.org/diseases-conditions/depression/symptoms-causes/syc-20356007', 'Mayo Clinic', 2),

  ('suicidal-thoughts', '988 Suicide & Crisis Lifeline', 'https://988lifeline.org/', '988 Lifeline', 1),
  ('suicidal-thoughts', 'SAMHSA — Suicide Prevention', 'https://www.samhsa.gov/suicide-prevention', 'SAMHSA', 2),
  ('suicidal-thoughts', 'Crisis Text Line', 'https://www.crisistextline.org/', 'Crisis Text Line', 3),

  ('rash', 'Mayo Clinic — Common Rashes', 'https://www.mayoclinic.org/diseases-conditions/rash/symptoms-causes/syc-20371236', 'Mayo Clinic', 1),
  ('rash', 'AAD — Skin Rashes', 'https://www.aad.org/public/everyday-care/injured-skin/treat-rashes', 'American Academy of Dermatology', 2),

  ('fever', 'Mayo Clinic — Fever', 'https://www.mayoclinic.org/diseases-conditions/fever/symptoms-causes/syc-20351624', 'Mayo Clinic', 1),
  ('fever', 'CDC — Fever and Temperature Taking', 'https://www.cdc.gov/fever/index.html', 'CDC', 2),

  ('sore-throat', 'CDC — Sore Throat', 'https://www.cdc.gov/sore-throat/index.html', 'CDC', 1),
  ('sore-throat', 'Mayo Clinic — Strep Throat', 'https://www.mayoclinic.org/diseases-conditions/strep-throat/symptoms-causes/syc-20351638', 'Mayo Clinic', 2),

  ('ear-infection', 'CDC — Ear Infection', 'https://www.cdc.gov/ear-infection/index.html', 'CDC', 1),
  ('ear-infection', 'Mayo Clinic — Ear Infection (Middle Ear)', 'https://www.mayoclinic.org/diseases-conditions/ear-infections/symptoms-causes/syc-20351616', 'Mayo Clinic', 2),

  ('nausea-and-vomiting', 'Mayo Clinic — Nausea and Vomiting', 'https://www.mayoclinic.org/symptoms/nausea/basics/definition/sym-20050720', 'Mayo Clinic', 1),
  ('nausea-and-vomiting', 'CDC — Norovirus', 'https://www.cdc.gov/norovirus/index.html', 'CDC', 2)
) AS src(slug, title, url, publisher, sort_order)
ON src.slug = s.slug;

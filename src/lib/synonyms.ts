/**
 * Healthcare synonym dictionary.
 * Maps layperson terms to clinical/professional terms that appear in resource data.
 * Used by the search engine to expand queries before fuzzy matching.
 *
 * Format: { laypersonTerm: [canonicalTerms...] }
 * The canonical terms get added to the search query so Fuse.js can match them.
 */

export const SYNONYMS: Record<string, string[]> = {
  // Cardiology
  'heart doctor': ['cardiologist', 'cardiology'],
  'heart specialist': ['cardiologist', 'cardiology'],
  'heart problem': ['cardiology', 'cardiac'],
  'heart attack': ['myocardial infarction', 'cardiac', 'emergency'],
  'chest pain': ['angina', 'cardiac', 'cardiology', 'emergency'],
  'chest tightness': ['cardiac', 'cardiology', 'emergency'],
  'chest pressure': ['cardiac', 'cardiology', 'emergency'],
  'heart palpitations': ['arrhythmia', 'cardiology'],
  'palpitations': ['arrhythmia', 'cardiology'],
  'high blood pressure': ['hypertension', 'cardiology'],
  'blood pressure': ['hypertension', 'cardiology'],

  // Dermatology
  'pink eye': ['conjunctivitis', 'ophthalmology'],
  'eye infection': ['conjunctivitis', 'ophthalmology'],
  'skin doctor': ['dermatologist', 'dermatology'],
  'skin problem': ['dermatology', 'skin'],
  'rash': ['dermatology', 'skin'],
  'acne': ['dermatology', 'skin'],
  'eczema': ['dermatology', 'skin'],
  'hives': ['urticaria', 'dermatology', 'skin'],
  'skin cancer': ['dermatology', 'oncology'],
  'mole': ['dermatology', 'skin'],
  'psoriasis': ['dermatology', 'skin'],

  // Mental health
  'shrink': ['psychiatrist', 'psychiatry', 'mental health'],
  'therapist': ['therapy', 'counseling', 'mental health'],
  'counselor': ['counseling', 'mental health'],
  'anxious': ['anxiety', 'mental health'],
  'depressed': ['depression', 'mental health'],
  'panic': ['panic attack', 'anxiety', 'mental health'],
  'panic attack': ['panic disorder', 'anxiety', 'mental health'],
  'ptsd': ['post traumatic stress', 'trauma', 'mental health'],
  'trauma': ['mental health', 'counseling'],
  'stress': ['mental health', 'counseling'],
  'grief': ['grief counseling', 'mental health'],
  'bipolar': ['bipolar disorder', 'psychiatry', 'mental health'],
  'adhd': ['attention deficit', 'psychiatry', 'mental health'],
  'ocd': ['obsessive compulsive', 'psychiatry', 'mental health'],
  'eating disorder': ['anorexia', 'bulimia', 'mental health'],

  // Substance use
  'addiction': ['substance use', 'substance abuse', 'addiction'],
  'addicted': ['substance use', 'addiction'],
  'alcoholic': ['alcoholism', 'substance use'],
  'alcoholism': ['substance use', 'alcohol'],
  'drug problem': ['substance use', 'addiction'],
  'drug addiction': ['substance use', 'addiction'],
  'opioid': ['substance use', 'opioid'],
  'opiates': ['substance use', 'opioid'],
  'overdose': ['substance use', 'overdose', 'crisis'],
  'naloxone': ['substance use', 'naloxone'],
  'narcan': ['substance use', 'naloxone'],
  'rehab': ['rehabilitation', 'substance use'],
  'sober': ['recovery', 'substance use'],
  'meth': ['methamphetamine', 'substance use'],

  // Dental
  'my teeth hurt': ['toothache', 'dental', 'tooth pain'],
  'teeth hurt': ['toothache', 'dental', 'tooth pain'],
  'tooth hurts': ['toothache', 'dental', 'tooth pain'],
  'tooth pain': ['toothache', 'dental'],
  'toothache': ['dental', 'tooth'],
  'cavity': ['dental', 'caries'],
  'cavities': ['dental', 'caries'],
  'broken tooth': ['dental', 'oral surgery'],
  'gum pain': ['dental', 'periodontal'],
  'gums hurt': ['dental', 'periodontal'],
  'gums bleeding': ['dental', 'periodontal'],
  'wisdom teeth': ['dental', 'oral surgery'],
  'root canal': ['dental', 'endodontics'],
  'teeth cleaning': ['dental', 'prophylaxis'],
  'dentures': ['dental', 'prosthodontics'],
  'braces': ['orthodontics', 'dental'],
  'teeth': ['dental'],
  'tooth': ['dental'],

  // Throat / ENT
  'throat hurts': ['sore throat', 'ent', 'primary care'],
  'sore throat': ['ent', 'primary care'],
  'throat pain': ['ent', 'primary care'],
  'ear hurts': ['ent', 'ear infection'],
  'ear pain': ['ent', 'ear infection'],
  'ear infection': ['ent', 'primary care'],

  // Stomach / digestive
  'stomach hurts': ['abdominal pain', 'primary care', 'gastroenterology'],
  'stomach ache': ['abdominal pain', 'primary care'],
  'belly hurts': ['abdominal pain', 'primary care'],
  'throwing up': ['nausea', 'vomiting', 'primary care'],
  'feel nauseous': ['nausea', 'primary care'],

  // Head / neuro
  'head hurts': ['headache', 'primary care', 'neurology'],
  'my head hurts': ['headache', 'primary care', 'neurology'],
  'headache': ['primary care', 'neurology'],
  'migraine': ['neurology', 'primary care'],

  // Skin
  'my skin': ['dermatology', 'skin'],
  'skin hurts': ['dermatology', 'skin'],
  'itchy': ['dermatology', 'skin'],

  // Eyes
  'my eyes hurt': ['ophthalmology', 'vision', 'eye pain'],
  'eyes hurt': ['ophthalmology', 'vision', 'eye pain'],
  'eye hurts': ['ophthalmology', 'vision', 'eye pain'],
  'blurry eyes': ['ophthalmology', 'vision'],

  // Back / musculoskeletal
  'my back hurts': ['back pain', 'primary care', 'physical therapy'],
  'back hurts': ['back pain', 'primary care', 'physical therapy'],
  'back pain': ['primary care', 'physical therapy'],
  'my knee hurts': ['orthopedics', 'physical therapy', 'primary care'],
  'knee hurts': ['orthopedics', 'physical therapy', 'primary care'],
  'my arm hurts': ['primary care', 'orthopedics'],
  'arm hurts': ['primary care', 'orthopedics'],

  // Mental health natural-language
  'feeling sad': ['depression', 'mental health', 'counseling'],
  'feeling anxious': ['anxiety', 'mental health', 'counseling'],
  'feeling down': ['depression', 'mental health'],
  'feeling hopeless': ['depression', 'crisis', 'mental health'],
  'can t sleep': ['insomnia', 'mental health', 'primary care'],
  'can t stop worrying': ['anxiety', 'mental health'],

  // Respiratory
  'breathing problem': ['respiratory', 'pulmonary'],
  'breathing difficulty': ['respiratory', 'pulmonary'],
  'short of breath': ['dyspnea', 'respiratory', 'pulmonary'],
  'shortness of breath': ['dyspnea', 'respiratory', 'pulmonary', 'emergency'],
  'wheezing': ['asthma', 'respiratory'],
  'asthma': ['respiratory', 'pulmonary'],
  'cough': ['respiratory', 'pulmonary'],
  'coughing': ['respiratory', 'pulmonary'],

  // Pregnancy / women's health
  'having a baby': ['obstetrics', 'prenatal'],
  'pregnant': ['obstetrics', 'prenatal', 'womens health'],
  'pregnancy': ['obstetrics', 'prenatal', 'womens health'],
  'prenatal': ['obstetrics', 'womens health'],
  'birth control': ['contraception', 'family planning', 'womens health'],
  'abortion': ['family planning', 'womens health'],
  'mammogram': ['mammography', 'womens health', 'cancer screening'],
  'pap smear': ['cervical screening', 'womens health'],
  'obgyn': ['obstetrics', 'gynecology', 'womens health'],
  'ob gyn': ['obstetrics', 'gynecology', 'womens health'],
  'gynecologist': ['gynecology', 'womens health'],

  // Pediatrics
  'kid doctor': ['pediatrician', 'pediatrics'],
  'child doctor': ['pediatrician', 'pediatrics'],
  'baby doctor': ['pediatrician', 'pediatrics'],
  'kids': ['pediatric', 'pediatrics', 'children'],
  'children': ['pediatric', 'pediatrics'],
  'child': ['pediatric', 'pediatrics'],
  'baby': ['pediatric', 'newborn'],
  'infant': ['pediatric', 'newborn'],

  // Vision / eye
  'eye doctor': ['ophthalmologist', 'ophthalmology', 'optometry'],
  'eye exam': ['ophthalmology', 'optometry'],
  'glasses': ['optometry', 'vision'],
  'contacts': ['optometry', 'vision'],
  'blurry vision': ['ophthalmology', 'vision'],
  'vision problem': ['ophthalmology', 'optometry', 'vision'],

  // General / primary care
  'doctor': ['physician', 'primary care'],
  'family doctor': ['primary care', 'family medicine'],
  'general doctor': ['primary care', 'family medicine'],
  'checkup': ['primary care', 'preventive'],
  'check up': ['primary care', 'preventive'],
  'physical': ['primary care', 'preventive', 'physical exam'],
  'sick': ['primary care', 'urgent care'],
  'flu': ['influenza', 'primary care', 'urgent care'],
  'cold': ['upper respiratory', 'primary care', 'urgent care'],
  'fever': ['primary care', 'urgent care'],
  'infection': ['primary care', 'urgent care'],
  'stomach pain': ['abdominal pain', 'primary care', 'gastroenterology'],
  'dizzy': ['dizziness', 'primary care'],
  'dizziness': ['primary care', 'neurology'],
  'nausea': ['primary care', 'gastroenterology'],
  'vomiting': ['primary care', 'gastroenterology'],
  'diarrhea': ['gastroenterology', 'primary care'],
  'constipation': ['gastroenterology', 'primary care'],

  // Pharmacy
  'prescription': ['pharmacy', 'prescription'],
  'medication': ['pharmacy', 'medication'],
  'medicine': ['pharmacy', 'medication'],
  'pills': ['pharmacy', 'medication'],
  'pharmacist': ['pharmacy'],
  'refill': ['pharmacy', 'prescription'],
  'vaccine': ['vaccination', 'pharmacy', 'immunization'],
  'vaccination': ['immunization', 'pharmacy', 'vaccine'],
  'shot': ['vaccination', 'pharmacy', 'immunization'],
  'flu shot': ['influenza vaccine', 'pharmacy'],

  // Food
  'hungry': ['food bank', 'food'],
  'no food': ['food bank', 'food'],
  'food pantry': ['food bank', 'food'],
  'groceries': ['food bank', 'food'],
  'meals': ['food bank', 'food', 'meals'],
  'snap': ['food stamps', 'snap', 'food bank'],
  'food stamps': ['snap', 'food bank'],
  'ebt': ['snap', 'food bank'],

  // Transportation
  'ride': ['transportation'],
  'bus': ['transportation', 'transit'],
  'transport': ['transportation'],
  'need a ride': ['transportation'],
  'medical transport': ['transportation', 'medical'],

  // Veterans
  'veteran': ['veterans', 'va'],
  'veterans': ['veterans', 'va'],
  'military': ['veterans', 'military'],
  'va': ['veterans', 'va'],

  // Crisis / emergency
  'suicidal': ['crisis', 'suicide', 'mental health'],
  'suicide': ['crisis', 'suicide', 'mental health'],
  'killing myself': ['crisis', 'suicide', 'mental health'],
  'self harm': ['crisis', 'mental health'],
  'selfharm': ['crisis', 'mental health'],
  'crisis': ['crisis line', 'crisis'],
  'emergency': ['emergency', 'urgent care', 'hospital'],
  'urgent': ['urgent care'],
  'urgent care': ['urgent care'],

  // Legal
  'lawyer': ['legal aid', 'legal'],
  'attorney': ['legal aid', 'legal'],
  'legal help': ['legal aid', 'legal'],
  'eviction': ['legal aid', 'eviction', 'housing'],
  'evicted': ['legal aid', 'eviction', 'housing'],

  // Housing / shelter
  'homeless': ['homeless', 'shelter', 'housing'],
  'shelter': ['shelter', 'homeless', 'housing'],
  'housing': ['housing', 'homeless'],
  'need a place to stay': ['shelter', 'homeless', 'housing'],

  // Insurance
  'medicaid': ['medicaid', 'apple health'],
  'apple health': ['medicaid', 'apple health'],
  'medicare': ['medicare'],
  'no insurance': ['uninsured', 'sliding scale'],
  'without insurance': ['uninsured', 'sliding scale'],
  'uninsured': ['uninsured', 'sliding scale'],

  // Accessibility / demographics
  'wheelchair': ['wheelchair', 'accessibility'],
  'disabled': ['disability', 'accessibility'],
  'disability': ['disability', 'accessibility'],
  'senior': ['senior', 'aging', 'elderly'],
  'elderly': ['senior', 'aging', 'elderly'],
  'aging': ['senior', 'aging'],

  // Specialty services
  'dialysis': ['dialysis', 'kidney', 'nephrology'],
  'kidney doctor': ['nephrologist', 'nephrology'],
  'physical therapy': ['physical therapy', 'rehabilitation'],
  'pt': ['physical therapy', 'rehabilitation'],
  'chiropractor': ['chiropractic'],
  'massage': ['massage therapy'],
  'acupuncture': ['acupuncture', 'alternative medicine'],

  // Domestic violence
  'domestic violence': ['domestic violence', 'dv'],
  'dv': ['domestic violence', 'dv'],
  'abuse': ['domestic violence', 'crisis'],
  'assault': ['domestic violence', 'crisis'],
};

// ─── Body-part → specialty mapping ────────────────────────────────────────────
// When a user mentions a body part, we know what kind of provider they need
// regardless of which sensation word they use. This prevents sensation words
// like "burning" from matching unrelated resources (e.g. a burn unit).

const BODY_PART_SPECIALTIES: Record<string, string[]> = {
  knee: ['orthopedics', 'physical therapy', 'primary care'],
  knees: ['orthopedics', 'physical therapy', 'primary care'],
  leg: ['orthopedics', 'physical therapy', 'primary care'],
  legs: ['orthopedics', 'physical therapy', 'primary care'],
  ankle: ['orthopedics', 'physical therapy', 'primary care'],
  ankles: ['orthopedics', 'physical therapy', 'primary care'],
  foot: ['orthopedics', 'physical therapy', 'podiatry'],
  feet: ['orthopedics', 'physical therapy', 'podiatry'],
  hip: ['orthopedics', 'physical therapy', 'primary care'],
  hips: ['orthopedics', 'physical therapy', 'primary care'],
  back: ['orthopedics', 'physical therapy', 'primary care'],
  spine: ['orthopedics', 'neurology', 'physical therapy'],
  neck: ['orthopedics', 'physical therapy', 'primary care'],
  shoulder: ['orthopedics', 'physical therapy', 'primary care'],
  shoulders: ['orthopedics', 'physical therapy', 'primary care'],
  arm: ['orthopedics', 'physical therapy', 'primary care'],
  arms: ['orthopedics', 'physical therapy', 'primary care'],
  elbow: ['orthopedics', 'physical therapy', 'primary care'],
  wrist: ['orthopedics', 'physical therapy', 'primary care'],
  hand: ['orthopedics', 'physical therapy', 'primary care'],
  hands: ['orthopedics', 'physical therapy', 'primary care'],
  finger: ['orthopedics', 'primary care'],
  fingers: ['orthopedics', 'primary care'],
  joint: ['orthopedics', 'physical therapy', 'rheumatology'],
  joints: ['orthopedics', 'physical therapy', 'rheumatology'],
  muscle: ['physical therapy', 'primary care'],
  muscles: ['physical therapy', 'primary care'],
  head: ['neurology', 'primary care'],
  skull: ['neurology', 'primary care'],
  brain: ['neurology'],
  eye: ['ophthalmology', 'optometry', 'primary care'],
  eyes: ['ophthalmology', 'optometry', 'primary care'],
  ear: ['ent', 'primary care'],
  ears: ['ent', 'primary care'],
  nose: ['ent', 'primary care'],
  throat: ['ent', 'primary care'],
  chest: ['cardiology', 'primary care', 'pulmonology'],
  heart: ['cardiology', 'cardiac'],
  lung: ['pulmonology', 'respiratory'],
  lungs: ['pulmonology', 'respiratory'],
  stomach: ['gastroenterology', 'primary care'],
  belly: ['gastroenterology', 'primary care'],
  abdomen: ['gastroenterology', 'primary care'],
  abdominal: ['gastroenterology', 'primary care'],
  gut: ['gastroenterology', 'primary care'],
  liver: ['gastroenterology', 'hepatology'],
  kidney: ['nephrology', 'urology'],
  kidneys: ['nephrology', 'urology'],
  bladder: ['urology', 'primary care'],
  skin: ['dermatology'],
  scalp: ['dermatology'],
  face: ['dermatology', 'ent'],
  mouth: ['dental', 'oral surgery'],
  tooth: ['dental'],
  teeth: ['dental'],
  gum: ['dental', 'periodontal'],
  gums: ['dental', 'periodontal'],
  tongue: ['dental', 'ent'],
  jaw: ['dental', 'ent'],
  pelvis: ['orthopedics', 'primary care'],
  ribs: ['orthopedics', 'primary care'],
  rib: ['orthopedics', 'primary care'],
};

// Sensation words that are ambiguous — they can describe a body part feeling
// OR a medical condition. When paired with a body part, they should NOT
// trigger condition-specific matching (e.g. "burning knee" ≠ burn unit).
const SENSATION_WORDS = new Set([
  'burning', 'burn', 'stinging', 'sting', 'tingling', 'numbness', 'numb',
  'throbbing', 'throb', 'aching', 'ache', 'soreness', 'sore', 'stiffness',
  'stiff', 'tightness', 'tight', 'cramping', 'cramp', 'spasming', 'spasm',
  'shooting', 'radiating', 'dull', 'sharp', 'pulsing', 'pulsating',
  'pins and needles', 'prickling', 'prickle', 'crawling', 'crawling sensation',
]);

/** Tokens to suppress from the search query when a body part provides context. */
const SUPPRESS_WHEN_BODY_PART_PRESENT = new Set([
  'burning', 'burn', 'stinging', 'sting',
]);

export interface BodyPartContext {
  /** Specialty terms inferred from body parts mentioned in the query. */
  specialties: string[];
  /** Sensation words detected (for interpretation display). */
  sensations: string[];
  /** Tokens to suppress because they'd cause false matches (e.g. "burning"). */
  suppress: string[];
  /** Body parts detected in the query. */
  bodyParts: string[];
}

/**
 * Detect body parts and sensations in a natural-language query.
 * Returns specialty expansions and tokens to suppress.
 */
export function detectBodyPartContext(query: string): BodyPartContext {
  const lower = ' ' + query.toLowerCase() + ' ';
  const specialties = new Set<string>();
  const sensations: string[] = [];
  const bodyParts: string[] = [];
  const suppress = new Set<string>();

  for (const [part, specs] of Object.entries(BODY_PART_SPECIALTIES)) {
    // Match as a whole word to avoid partial matches (e.g. "arm" in "farm")
    const wordBoundary = new RegExp(`\\b${part}\\b`, 'i');
    if (wordBoundary.test(lower)) {
      bodyParts.push(part);
      for (const sp of specs) specialties.add(sp);
    }
  }

  for (const sensation of SENSATION_WORDS) {
    if (lower.includes(sensation)) {
      sensations.push(sensation);
      if (bodyParts.length > 0 && SUPPRESS_WHEN_BODY_PART_PRESENT.has(sensation)) {
        suppress.add(sensation);
      }
    }
  }

  return {
    specialties: [...specialties],
    sensations,
    suppress: [...suppress],
    bodyParts,
  };
}

/**
 * Expand a query string with synonyms.
 * Returns the original query plus any synonym expansions appended.
 * Also applies body-part context to add relevant specialties and suppress
 * ambiguous sensation words that would cause false matches.
 */
export function expandWithSynonyms(query: string): string {
  const lower = query.toLowerCase();
  const additions = new Set<string>();

  for (const [trigger, expansions] of Object.entries(SYNONYMS)) {
    if (lower.includes(trigger)) {
      for (const exp of expansions) additions.add(exp);
    }
  }

  // Body-part context: add specialties inferred from body parts
  const bodyContext = detectBodyPartContext(query);
  for (const sp of bodyContext.specialties) additions.add(sp);

  // Build the expanded string, suppressing ambiguous tokens when body parts
  // provide clearer context (e.g. "burning knee" → search for orthopedics,
  // not burn units)
  let baseQuery = query;
  if (bodyContext.suppress.length > 0) {
    const tokens = baseQuery.toLowerCase().split(/(\s+)/);
    const filtered = tokens.filter((t) => {
      const trimmed = t.trim();
      return !bodyContext.suppress.includes(trimmed);
    });
    baseQuery = filtered.join('');
  }

  if (additions.size === 0 && bodyContext.suppress.length === 0) return query;
  return `${baseQuery} ${[...additions].join(' ')}`.trim();
}

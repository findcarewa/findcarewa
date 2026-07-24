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
  'tooth pain': ['toothache', 'dental'],
  'toothache': ['dental', 'tooth'],
  'cavity': ['dental', 'caries'],
  'cavities': ['dental', 'caries'],
  'broken tooth': ['dental', 'oral surgery'],
  'gum pain': ['dental', 'periodontal'],
  'wisdom teeth': ['dental', 'oral surgery'],
  'root canal': ['dental', 'endodontics'],
  'teeth cleaning': ['dental', 'prophylaxis'],
  'dentures': ['dental', 'prosthodontics'],
  'braces': ['orthodontics', 'dental'],

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
  'stomach ache': ['abdominal pain', 'primary care'],
  'headache': ['primary care', 'neurology'],
  'migraine': ['neurology', 'primary care'],
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

/**
 * Expand a query string with synonyms.
 * Returns the original query plus any synonym expansions appended.
 */
export function expandWithSynonyms(query: string): string {
  const lower = query.toLowerCase();
  const additions = new Set<string>();

  for (const [trigger, expansions] of Object.entries(SYNONYMS)) {
    if (lower.includes(trigger)) {
      for (const exp of expansions) additions.add(exp);
    }
  }

  if (additions.size === 0) return query;
  return `${query} ${[...additions].join(' ')}`;
}

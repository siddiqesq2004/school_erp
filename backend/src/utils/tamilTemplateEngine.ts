// ═══════════════════════════════════════════════════════════
// Tamil Template Engine
// Renders bilingual (Tamil + English) templates with variables
// ═══════════════════════════════════════════════════════════

export type TemplateLanguage = 'TA' | 'EN' | 'BILINGUAL';

export interface TemplateVars {
  [key: string]: string | number | undefined | null;
}

const TAMIL_DIGITS: Record<string, string> = {
  '0': '௦', '1': '௧', '2': '௨', '3': '௩', '4': '௪',
  '5': '௫', '6': '௬', '7': '௭', '8': '௮', '9': '௯',
};

export function toTamilDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => TAMIL_DIGITS[d] || d);
}

export function renderTemplate(
  body: string,
  vars: TemplateVars,
  language: TemplateLanguage = 'EN'
): string {
  // Replace {{var}} placeholders
  let rendered = body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return `[${key}]`;
    return String(v);
  });

  if (language === 'TA') {
    rendered = toTamilDigits(rendered);
  }

  return rendered;
}

export function renderBilingual(
  english: string,
  tamil: string,
  vars: TemplateVars
): { en: string; ta: string; combined: string } {
  return {
    en: renderTemplate(english, vars, 'EN'),
    ta: renderTemplate(tamil, vars, 'TA'),
    combined: `${renderTemplate(english, vars, 'EN')}\n\n— தமிழ் —\n${renderTemplate(tamil, vars, 'TA')}`,
  };
}

export function extractVariables(body: string): string[] {
  const matches = body.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  const set = new Set<string>();
  for (const m of matches) set.add(m[1]);
  return Array.from(set);
}

export const DEFAULT_TAMIL_TEMPLATES = {
  ATTENDANCE_ABSENT_TA: {
    name: 'வரவில்லை - பெற்றோர் அறிவிப்பு',
    category: 'ATTENDANCE',
    subject: '{{studentName}} - வருகை அறிக்கை',
    body: 'தமிழ்நாடு அரசு பள்ளி / {{schoolName}}\n\nவணக்கம் {{parentName}},\n\nஇன்று ({{date}}) உங்கள் மகன்/மகள் {{studentName}}, வகுப்பு {{className}} பள்ளிக்கு வரவில்லை.\n\nஆய்வாளர்: {{markedBy}}\n\nஉடனடி காரணத்தை தெரியப்படுத்துமாறு கேட்டுக்கொள்கிறோம்.\n\nநன்றி,\n{{schoolName}} நிர்வாகம்',
  },
  ATTENDANCE_ABSENT_EN: {
    name: 'Attendance Alert - Parent',
    category: 'ATTENDANCE',
    subject: '{{studentName}} - Absence Notification',
    body: '{{schoolName}}\n\nDear {{parentName}},\n\nYour ward {{studentName}} of class {{className}} was marked absent on {{date}}.\n\nReason pending.\n\nPlease respond with a valid reason.\n\nRegards,\n{{schoolName}} Admin',
  },
  FEE_REMINDER_TA: {
    name: 'கட்டண நினைவூட்டி',
    category: 'FEE',
    subject: '{{studentName}} - கட்டண நினைவூட்டி',
    body: '{{schoolName}}\n\nவணக்கம் {{parentName}},\n\n{{studentName}} (வகுப்பு {{className}}) அவர்களின் {{month}} மாத கட்டணம் ₹{{amount}} செலுத்த வேண்டிய நாள் கடந்துவிட்டது.\n\nதாமத கட்டணம்: ₹{{lateFee}}\n\nஉடனடியாக செலுத்துமாறு கேட்டுக்கொள்கிறோம்.\n\n{{schoolName}}',
  },
  EXAM_RESULT_TA: {
    name: 'தேர்வு முடிவு - தமிழ்',
    category: 'EXAM',
    subject: '{{studentName}} - {{examName}} முடிவு',
    body: '{{schoolName}}\n\nவணக்கம் {{parentName}},\n\n{{examName}} தேர்வில் {{studentName}} பெற்ற மதிப்பெண்: {{marks}}/{{maxMarks}} ({{grade}})\n\nவகுப்பு தரவரிசை: {{rank}}\n\nநன்றி,\n{{schoolName}}',
  },
};

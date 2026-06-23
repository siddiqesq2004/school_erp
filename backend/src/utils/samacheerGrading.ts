// ═══════════════════════════════════════════════════════════
// Samacheer Kalvi Grading Engine
// Implements Tamil Nadu board grading rules
// ═══════════════════════════════════════════════════════════

export type SamacheerGrade =
  | 'DISTINCTION'
  | 'FIRST_CLASS'
  | 'SECOND_CLASS'
  | 'PASS'
  | 'FAIL';

export function computeSamacheerGrade(
  totalMarks: number,
  maxMarks: number,
  passPercentage: number = 35,
  graceMarks: number = 5
): SamacheerGrade {
  if (totalMarks <= 0) return 'FAIL';
  const percentage = (totalMarks / maxMarks) * 100;
  const passMarks = (maxMarks * passPercentage) / 100;
  const effectivePass = passMarks - graceMarks;

  if (totalMarks < effectivePass) return 'FAIL';
  if (percentage >= 75) return 'DISTINCTION';
  if (percentage >= 60) return 'FIRST_CLASS';
  if (percentage >= 50) return 'SECOND_CLASS';
  return 'PASS';
}

export function computeTermTotal(theory: number, practical: number): number {
  return Number(theory) + Number(practical);
}

export function computeAnnualTotal(
  term1: number,
  term2: number,
  term3: number
): { total: number; average: number; grade: SamacheerGrade } {
  const total = term1 + term2 + term3;
  const average = total / 3;
  const grade = computeSamacheerGrade(average, 100);
  return { total, average, grade };
}

export const SAMACHEER_GRADE_LABELS: Record<SamacheerGrade, string> = {
  DISTINCTION: 'Distinction (75%+)',
  FIRST_CLASS: 'First Class (60-74%)',
  SECOND_CLASS: 'Second Class (50-59%)',
  PASS: 'Pass (35-49%)',
  FAIL: 'Fail',
};

export const SAMACHEER_GRADE_COLORS: Record<SamacheerGrade, string> = {
  DISTINCTION: '#16a34a',
  FIRST_CLASS: '#22c55e',
  SECOND_CLASS: '#eab308',
  PASS: '#f97316',
  FAIL: '#dc2626',
};

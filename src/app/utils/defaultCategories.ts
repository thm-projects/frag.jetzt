import { HasStringLength } from './ts-utils';

type HasObjectArrayStringLengths<T extends { [key: string]: Readonly<string[]> }> =
  false extends HasStringLength<3, 20, T[keyof T][number]> ? false : true;

export const defaultCategories = {
  de: [
    'Kommentar',
    'Verständnisfrage',
    'Feedback',
    'Organisatorisches',
    'Technisches Problem',
    '»frag.jetzt«',
    'Quizzing',
    'Sonstiges',
  ],
  en: [
    'Comment',
    'Comprehension',
    'Feedback',
    'Organizational',
    'Technical problem',
    '»frag.jetzt«',
    'Quizzing',
    'Miscellaneous',
  ],
  default: [
    'Feedback',
    '»frag.jetzt«',
    'Quizzing',
  ],
} as const;

const ASSERT_VALID: HasObjectArrayStringLengths<typeof defaultCategories> = true;


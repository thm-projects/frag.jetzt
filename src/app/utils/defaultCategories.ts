type StringOfLength<Min, Max> = string & {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly StringOfLength: unique symbol;
};

const isStringOfLength = <Min extends number, Max extends number>(
  str: string,
  min: Min,
  max: Max
): str is StringOfLength<Min, Max> => str.length >= min && str.length <= max;

const stringOfLength = <Min extends number, Max extends number>(
  input: unknown,
  min: Min,
  max: Max
): StringOfLength<Min, Max> => {
  if (typeof input !== 'string') {
    throw new Error('invalid input');
  }

  if (!isStringOfLength(input, min, max)) {
    throw new Error('"' + input + '"[' + input.length + '] is not between specified min[' + min + '] and max[' + max + ']');
  }

  return input;
};

interface Categories {
  [key: string]: StringOfLength<3, 20>[];
}

const verify = (strArr: string[]): StringOfLength<3, 20>[] => strArr.map(e => stringOfLength(e, 3, 20));

export const defaultCategories: Categories = {
  de: verify([
    'Kommentar',
    'Verständnisfrage',
    'Feedback',
    'Organisatorisches',
    'Technisches Problem',
    '»frag.jetzt«',
    'Quizzing',
    'Sonstiges',
  ]),
  en: verify([
    'Comment',
    'Comprehension',
    'Feedback',
    'Organizational',
    'Technical problem',
    '»frag.jetzt«',
    'Quizzing',
    'Miscellaneous',
  ]),
  default: verify([]),
};

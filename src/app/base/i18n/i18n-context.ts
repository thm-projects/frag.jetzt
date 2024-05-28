const regex = /\{\{([a-zA-Z0-9]*)\}\}/gm;

export const substitueVariables = (
  str: string,
  data: Record<string, string>,
) => {
  let newStr = '';
  let m: RegExpExecArray;
  let lastIndex = 0;
  while ((m = regex.exec(str)) !== null) {
    const substitution = data[m[1]];
    if (substitution !== undefined) {
      newStr += str.slice(lastIndex, m.index) + substitution;
      lastIndex = m.index + m[0].length;
    }
  }
  return newStr;
};

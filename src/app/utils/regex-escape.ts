export const escapeForRegex = (str: string): string =>
  str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');

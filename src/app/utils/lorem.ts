const _lorem =
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`.split(
    /\s/gm,
  );
export const lorem = (words: number) => {
  return new Array(words)
    .fill(null)
    .map((e, i) => _lorem[i % _lorem.length])
    .join(' ');
};

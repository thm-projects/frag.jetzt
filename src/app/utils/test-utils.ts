let shortIdCounter = 0;

export const generateShortId = () => {
  const current = shortIdCounter++;
  return current.toString(10).padStart(8, '0');
};

let uuidCounter = 0;

export const generateConsequentlyUUID = () => {
  const current = uuidCounter++;
  const string = current.toString(16).padStart(32, '0');
  return [
    string.substr(0, 8),
    string.substr(8, 4),
    string.substr(12, 4),
    string.substr(16, 4),
    string.substr(20, 12)
  ].join('-');
};

export const generateRandomUUID = () => {
  const randomHexString1 = Math.random().toString(16).substr(2).padEnd(14, '0');
  const randomHexString2 = Math.random().toString(16).substr(2).padEnd(14, '0');
  const randomHexString3 = Math.random().toString(16).substr(2).padEnd(14, '0');
  return [
    randomHexString1.substr(0, 8),
    randomHexString1.substr(8, 4),
    randomHexString2.substr(0, 4),
    randomHexString2.substr(4, 4),
    randomHexString3.substr(0, 12)
  ].join('-');
};

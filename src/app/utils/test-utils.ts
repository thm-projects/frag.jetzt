import { UUID } from './ts-utils';

let shortIdCounter = 0;

export const generateShortId = () => {
  const current = shortIdCounter++;
  return current.toString(10).padStart(8, '0');
};

export const generateBoolean = () => {
  return shortIdCounter++ % 2 === 0;
};

let uuidCounter = 0;

export const generateConsequentlyUUID = () => {
  const current = uuidCounter++;
  const string = current.toString(16).padStart(32, '0');
  return [
    string.substring(0, 8),
    string.substring(8, 12),
    string.substring(12, 16),
    string.substring(16, 20),
    string.substring(20, 32),
  ].join('-') as UUID;
};

export const generateRandomUUID = () => {
  const randomHexString1 = Math.random()
    .toString(16)
    .substring(2)
    .padEnd(14, '0');
  const randomHexString2 = Math.random()
    .toString(16)
    .substring(2)
    .padEnd(14, '0');
  const randomHexString3 = Math.random()
    .toString(16)
    .substring(2)
    .padEnd(14, '0');
  return [
    randomHexString1.substring(0, 8),
    randomHexString1.substring(8, 12),
    randomHexString2.substring(0, 4),
    randomHexString2.substring(4, 8),
    randomHexString3.substring(0, 12),
  ].join('-') as UUID;
};

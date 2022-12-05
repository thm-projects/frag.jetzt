import assert from "assert";
globalThis.debugLog = (str) => console.log(str);
import { calculateWordCloudPlacing } from "../build/debug.js";
/*const arr = new Array(3 * 200).fill(0);
for (let i = 0; i < 200; i++) {
  arr[i * 3] = Math.random() * 50 + 50;
  arr[i * 3] = Math.random() * 16 + 16;
}*/
//const arr = [3970, 1970, 314.531, 142.656, 0, 550.359, 132, 0, 662.109, 121.328, 0, 341.797, 100, 0, 345.5, 100, 0, 345.5, 100, 0, 617.609, 100, 0, 244.109, 100, 0, 390, 89.3281, 0, 158.688, 89.3281, 0, 306.703, 89.3281, 0, 241.984, 89.3281, 0];
const arr = [3970, 1970, 0, 314.531, 142.656, 0, 550.359, 132, 0, 662.109, 121.328, 0, 341.797, 100, 0, 345.5, 100, 0];
console.log(calculateWordCloudPlacing(arr));
assert.strictEqual(1 + 2, 3);
console.log("ok");

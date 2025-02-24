// TODO(lph) add this to pipeline, then don't commit exposed assets (remove 'palette-codes.json')

const fs = require("fs");
const map = new Map();
for (let match of fs
  .readFileSync("m3-token-map.scss")
  .toString("utf-8")
  .matchAll(/--md-ref-palette-([^0-9]+)(\d+)/gm)) {
  if (!map.has(match[1])) {
    map.set(match[1], new Set());
  }
  map.get(match[1]).add(match[2]);
}
fs.writeFileSync(
  "../assets/m3-style/palette-codes.json",
  JSON.stringify(
    Array.from(map.entries()).reduce((obj, [key, value]) => {
      obj[key] = Array.from(value.values())
        .map((x) => parseInt(x))
        .sort((a, b) => a - b);
      return obj;
    }, {}),
  ),
);

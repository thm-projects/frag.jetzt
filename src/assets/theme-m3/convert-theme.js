/* eslint no-use-before-define: 0 */
const fs = require("fs");
const source = fs.readFileSync("tokens.css").toString("utf-8");
const requiredVariants = {
  primary: [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100],
  secondary: [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100],
  "neutral-variant": [
    0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100,
  ],
  neutral: [
    0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100, 4, 6, 12,
    17, 22, 24, 87, 92, 94, 96,
  ].sort((a, b) => a - b),
};
(() => {
  const variantMap = parseVariantMap();
  const patchedObject = patchMissingValues();
  const scssResult = convertToScss(patchedObject);
  console.log(scssResult);

  function convertToScss() {
    return traverse(patchedObject);

    function traverse(obj) {
      return Object.entries(obj)
        .map(([key, value]) => {
          if (typeof value === "object") {
            return `${key}:(${traverse(value)})`;
          } else {
            return `${key}:${value}`;
          }
        })
        .join(",");
    }
  }

  function patchMissingValues() {
    const result = {
      primary: {
        secondary: {},
        neutral: {},
        "neutral-variant": {},
      },
    };
    for (let [name, entry] of Object.entries(variantMap)) {
      if (requiredVariants[name]) {
        const currentHues = entry;
        const targetHues = requiredVariants[name];
        targetHues.forEach((targetHue) => {
          if (!currentHues[targetHue]) {
            const { prevHue, nextHue } = findClosestHues(
              currentHues,
              targetHue,
            );
            currentHues[targetHue] = estimateHue(
              currentHues,
              targetHue,
              prevHue,
              nextHue,
            );
          }
        });
        if (result[name]) {
          result[name] = {
            ...result[name],
            ...currentHues,
          };
        } else {
          result["primary"][name] = currentHues;
        }
      }
    }
    return result;
  }

  function parseVariantMap() {
    const regex = /--md-ref-palette-([^:0-9]+)([0-9]+): ?([^;]+);/gm;
    const variantMap = {};
    let next;
    while ((next = regex.exec(source))) {
      const [, ident, index, value] = next;
      if (!variantMap[ident]) {
        variantMap[ident] = {};
      }
      variantMap[ident][parseInt(index)] = value;
    }
    return variantMap;
  }

  function findClosestHues(hues, targetHue) {
    const sortedHues = Object.keys(hues).sort((a, b) => a - b);
    const index = sortedHues.findIndex((hue) => hue >= targetHue);
    const prevHue = sortedHues[index - 1];
    const nextHue = sortedHues[index];
    return { prevHue, nextHue };
  }

  function estimateHue(hues, hue, prevHue, nextHue) {
    const weight = ((nextHue - hue) / (nextHue - prevHue)) * 100;
    const prevColor = hues[prevHue];
    const nextColor = hues[nextHue];
    const prevRGB = parseInt(prevColor.slice(1), 16);
    const nextRGB = parseInt(nextColor.slice(1), 16);
    const weightedR = Math.round(
      (prevRGB >> 16) + (weight / 100) * ((nextRGB >> 16) - (prevRGB >> 16)),
    );
    const weightedG = Math.round(
      ((prevRGB >> 8) & 0xff) +
        (weight / 100) * (((nextRGB >> 8) & 0xff) - ((prevRGB >> 8) & 0xff)),
    );
    const weightedB = Math.round(
      (prevRGB & 0xff) + (weight / 100) * ((nextRGB & 0xff) - (prevRGB & 0xff)),
    );
    return `#${((1 << 24) | (weightedR << 16) | (weightedG << 8) | weightedB)
      .toString(16)
      .slice(1)}`;
  }
})();

/**
 * red in [0, 255], green in [0, 255], blue in [0, 255]
 */
export type ColorRGB = [red: number, green: number, blue: number];
/**
 * red in [0, 1], green in [0, 1], blue in [0, 1]
 */
export type ColorSRGB = [red: number, green: number, blue: number];
/**
 * hue in [0, 360], saturation in [0, 1], luma in [0, 1]
 */
export type ColorHSLuma = [hue: number, saturation: number, luma: number];
/**
 * hue in [0, 360], saturation in [0, 1], lightness in [0, 1]
 */
export type ColorHSL = [hue: number, saturation: number, lightness: number];

const HSLIndexes = [
  [0, 1],
  [1, 0],
  [1, 2],
  [2, 1],
  [2, 0],
  [0, 2]
] as const;

const WCAGLuminanceCoefficients = [0.2126, 0.7152, 0.0722] as const;

export class ColorContrast {

  /**
   * Definition after <a href="https://www.w3.org/TR/WCAG21/#dfn-relative-luminance">W3 - WCAG 2.1</a>
   *
   * @param color a srgb color
   * @returns an relative luminance between 0 and 1
   */
  static getWCAGRelativeLuminance(color: ColorSRGB): number {
    const [r, g, b] = color;
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  }

  /**
   * Definition after <a href="https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio">W3 - WCAG 2.1</a>
   *
   * @param firstColor the first rgb color
   * @param secondColor the second rgb color
   * @returns the relative luminance in 1:1 till 21:1
   */
  static getWCAGContrast(
    firstColor: ColorRGB,
    secondColor: ColorRGB
  ): number {
    const firstL = this.getWCAGRelativeLuminance(this.rgbToSrgb(firstColor));
    const secondL = this.getWCAGRelativeLuminance(this.rgbToSrgb(secondColor));
    const l1 = Math.max(firstL, secondL);
    const l2 = Math.min(firstL, secondL);
    return (l1 + 0.05) / (l2 + 0.05);
  }

  static rgbToHsl(color: ColorRGB, fallbackHue: number = 0): ColorHSL {
    const srgb = this.rgbToSrgb(color);
    const [sr, sg, sb] = srgb;
    const max = Math.max(sr, sg, sb);
    const min = Math.min(sr, sg, sb);
    const chromaticRange = max - min;
    let hue;
    if (chromaticRange < Number.EPSILON) {
      hue = fallbackHue;
    } else if (max === sr) {
      hue = (sg - sb) / chromaticRange;
    } else if (max === sg) {
      hue = (sb - sr) / chromaticRange + 2;
    } else if (max === sb) {
      hue = (sr - sg) / chromaticRange + 4;
    } else {
      console.error('Unreachable');
      return null;
    }
    hue *= 60;
    hue = hue < 0 ? hue + 360 : hue;
    const lightness = (max + min) / 2;
    if (lightness < Number.EPSILON || 1 - lightness < Number.EPSILON) {
      return [hue, 0, lightness];
    }
    const saturation = chromaticRange / (1 - Math.abs(2 * lightness - 1));
    return [hue, saturation, lightness];
  }


  /**
   * @param color an rgb color
   * @param fallbackHue in [0, 360]
   * @param contrastRatio in [1, 21]
   */
  static getInvertedColor(color: ColorRGB, fallbackHue: number = 0, contrastRatio: number = 4.5): ColorRGB {
    const [h, s, l] = this.RGBToHSLuma(color, fallbackHue);
    const invertedHue = (180 + h) % 360;
    const ensureBoundaries = (x: number) => Math.max(0, Math.min(1, x));
    const lighter = ensureBoundaries(l * contrastRatio + 0.05 * (contrastRatio - 1));
    const darker = ensureBoundaries((l + 0.05) / contrastRatio - 0.05);
    const lighterContrast = (lighter + 0.05) / (l + 0.05);
    const darkerContrast = (l + 0.05) / (darker + 0.05);
    return ColorContrast.HSLumaToRGB([invertedHue, s, lighterContrast > darkerContrast ? lighter : darker]);
  }

  public static rgbToSrgb(color: ColorRGB): ColorSRGB {
    const computeSRGB = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return color.map(v => computeSRGB(v / 255)) as [red: number, green: number, blue: number];
  }

  private static srgbToRgb(color: ColorSRGB): ColorRGB {
    const computeRGB = (v: number) => v < 0.00304 ? v * 12.92 : Math.pow(v, 1 / 2.4) * 1.055 - 0.055;
    return color.map(v => Math.round(computeRGB(v) * 255)) as ColorRGB;
  }

  private static RGBToHSLuma(color: ColorRGB, fallbackHue: number = 0): ColorHSLuma {
    const srgb = this.rgbToSrgb(color);
    const [sr, sg, sb] = srgb;
    const max = Math.max(sr, sg, sb);
    const min = Math.min(sr, sg, sb);
    const chromaticRange = max - min;
    let hue;
    if (chromaticRange < Number.EPSILON) {
      hue = fallbackHue;
    } else if (max === sr) {
      hue = (sg - sb) / chromaticRange;
    } else if (max === sg) {
      hue = (sb - sr) / chromaticRange + 2;
    } else if (max === sb) {
      hue = (sr - sg) / chromaticRange + 4;
    } else {
      console.error('Unreachable');
      return null;
    }
    hue *= 60;
    hue = hue < 0 ? hue + 360 : hue;
    const luma = this.getWCAGRelativeLuminance(srgb);
    const lightness = (max + min) / 2;
    if (lightness < Number.EPSILON || 1 - lightness < Number.EPSILON) {
      return [hue, 0, luma];
    }
    const saturation = chromaticRange / (1 - Math.abs(2 * lightness - 1));
    return [hue, saturation, luma];
  }

  private static HSLumaToRGB(color: ColorHSLuma) {
    const [h, s, luma] = color;
    const hueSub = h / 60;
    const hueRatio = 1 - Math.abs(hueSub % 2 - 1);
    const truncatedHue = Math.trunc(hueSub);
    const indexes = HSLIndexes[truncatedHue];
    const f_1 = WCAGLuminanceCoefficients[indexes[0]];
    const f_2 = WCAGLuminanceCoefficients[indexes[1]];
    const ratio = 2 * s * (f_1 + f_2 * hueRatio - 0.5);
    const l1 = luma / (ratio + 1);
    const l2 = (luma - ratio) / (1 - ratio);
    const distL1 = Math.abs(0.5 - l1);
    const distL2 = Math.abs(0.5 - l2);
    let l = distL1 > distL2 ? l2 : l1;
    const canTakeL1 = l1 <= 0.5;
    const canTakeL2 = l2 >= 0.5;
    if (!canTakeL1 && canTakeL2) {
      l = l2;
    } else if (canTakeL1 && !canTakeL2) {
      l = l1;
    }
    const chromaticRange = s * (1 - Math.abs(2 * l - 1));
    const x = chromaticRange * hueRatio;
    const result: ColorSRGB = [0, 0, 0];
    result[indexes[0]] = chromaticRange;
    result[indexes[1]] = x;
    const m = l - chromaticRange / 2;
    const srgb = result.map(el => el + m) as ColorSRGB;
    return this.srgbToRgb(srgb);
  }

}

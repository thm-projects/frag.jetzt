import {
  DARK_THEME,
  DefaultCloudParameters,
  LIGHT_THEME,
} from './cloud-parameters.const';

export interface CloudWeightSetting {
  maxVisibleElements: number;
  color: string;
  rotation: number;
  allowManualTagNumber: boolean;
}

export type CloudWeightSettings = [
  weight1: CloudWeightSetting,
  weight2: CloudWeightSetting,
  weight3: CloudWeightSetting,
  weight4: CloudWeightSetting,
  weight5: CloudWeightSetting,
  weight6: CloudWeightSetting,
  weight7: CloudWeightSetting,
  weight8: CloudWeightSetting,
  weight9: CloudWeightSetting,
  weight10: CloudWeightSetting,
];

export enum CloudTextStyle {
  Normal = 'unset',
  Lowercase = 'lowercase',
  Capitalized = 'capitalize',
  Uppercase = 'uppercase',
}

export const TEXT_STYLES = [
  CloudTextStyle.Normal,
  CloudTextStyle.Lowercase,
  CloudTextStyle.Capitalized,
  CloudTextStyle.Uppercase,
];

const colorRegex = /rgba?\((\d+), (\d+), (\d+)(?:, (\d(?:\.\d+)?))?\)/;

export const POSSIBLE_FONT_FAMILIES = [
  'sans-serif',
  'Abril Fatface',
  'Dancing Script',
  'Indie Flower',
  'Permanent Marker',
] as const;

type SupportedFonts = (typeof POSSIBLE_FONT_FAMILIES)[number];

export class CloudParameters {
  fontFamily: SupportedFonts;
  fontStyle: string;
  fontWeight: string;
  fontSize: string;
  backgroundColor: string;
  fontColor: string;
  fontSizeMin: number;
  fontSizeMax: number;
  hoverScale: number;
  hoverTime: number;
  hoverDelay: number;
  delayWord: number;
  randomAngles: boolean;
  sortAlphabetically: boolean;
  textTransform: CloudTextStyle;
  cloudWeightSettings: CloudWeightSettings;

  constructor(obj?: Partial<CloudParameters>) {
    if (obj) {
      this.fontFamily = obj.fontFamily;
      this.fontStyle = obj.fontStyle;
      this.fontWeight = obj.fontWeight;
      this.fontSize = obj.fontSize;
      this.backgroundColor = obj.backgroundColor;
      this.fontColor = obj.fontColor;
      this.fontSizeMin = obj.fontSizeMin;
      this.fontSizeMax = obj.fontSizeMax;
      this.hoverScale = obj.hoverScale;
      this.hoverTime = obj.hoverTime;
      this.hoverDelay = obj.hoverDelay;
      this.delayWord = obj.delayWord;
      this.randomAngles = obj.randomAngles;
      this.sortAlphabetically = obj.sortAlphabetically;
      this.textTransform = obj.textTransform;
      this.cloudWeightSettings = [
        { ...obj.cloudWeightSettings[0] },
        { ...obj.cloudWeightSettings[1] },
        { ...obj.cloudWeightSettings[2] },
        { ...obj.cloudWeightSettings[3] },
        { ...obj.cloudWeightSettings[4] },
        { ...obj.cloudWeightSettings[5] },
        { ...obj.cloudWeightSettings[6] },
        { ...obj.cloudWeightSettings[7] },
        { ...obj.cloudWeightSettings[8] },
        { ...obj.cloudWeightSettings[9] },
      ];
    }
  }

  static set currentParameters(parameters: CloudParameters) {
    localStorage.setItem('tagCloudConfiguration', JSON.stringify(parameters));
  }

  static getCurrentParameters(isCurrentlyDark: boolean): CloudParameters {
    const jsonData = localStorage.getItem('tagCloudConfiguration');
    const temp = jsonData != null ? JSON.parse(jsonData) : null;
    const elem = new CloudParameters();
    elem.resetToDefault(isCurrentlyDark);
    if (temp != null) {
      for (const key of Object.keys(elem)) {
        if (temp[key] !== undefined) {
          elem[key] = temp[key];
        }
      }
    }
    return elem;
  }

  static removeParameters() {
    localStorage.removeItem('tagCloudConfiguration');
  }

  private static resolveColor(
    element: HTMLParagraphElement,
    color: string,
  ): string {
    element.style.backgroundColor = 'rgb(0, 0, 0)';
    element.style.backgroundColor = color;
    const result = window
      .getComputedStyle(element)
      .backgroundColor.match(colorRegex);
    const r = parseInt(result[1], 10);
    const g = parseInt(result[2], 10);
    const b = parseInt(result[3], 10);
    return `#${((r * 256 + g) * 256 + b).toString(16).padStart(6, '0')}`;
  }

  private static mapValue(
    current: number,
    minInput: number,
    maxInput: number,
    minOut: number,
    maxOut: number,
  ) {
    const value =
      ((current - minInput) * (maxOut - minOut)) / (maxInput - minInput) +
      minOut;
    return Math.min(maxOut, Math.max(minOut, value));
  }

  resetToDefault(isDark: boolean) {
    const theme: DefaultCloudParameters = isDark ? DARK_THEME : LIGHT_THEME;
    const p = document.createElement('p');
    p.style.display = 'none';
    document.body.appendChild(p);
    const minValue =
      window.innerWidth < window.innerHeight
        ? window.innerWidth
        : window.innerHeight;
    const isMobile = minValue < 700;
    const elements = isMobile ? 10 : 20;
    this.fontFamily = 'Indie Flower';
    this.fontStyle = 'normal';
    this.fontWeight = 'bold';
    this.fontSize = '12px';
    this.backgroundColor = CloudParameters.resolveColor(
      p,
      theme.backgroundColor,
    );
    this.fontColor = CloudParameters.resolveColor(p, theme.hoverColor);
    this.fontSizeMin = CloudParameters.mapValue(minValue, 375, 750, 125, 200);
    this.fontSizeMax = CloudParameters.mapValue(minValue, 375, 1500, 300, 900);
    this.hoverScale = CloudParameters.mapValue(minValue, 375, 1500, 1.4, 2);
    this.hoverTime = 1.0;
    this.hoverDelay = 0.3;
    this.delayWord = 700;
    this.randomAngles = false;
    this.sortAlphabetically = false;
    this.textTransform = CloudTextStyle.Normal;
    this.cloudWeightSettings = [
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w1),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w2),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w3),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w4),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w5),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w6),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w7),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w8),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w9),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
      {
        maxVisibleElements: elements,
        color: CloudParameters.resolveColor(p, theme.w10),
        rotation: 0,
        allowManualTagNumber: isMobile,
      },
    ];
    p.remove();
  }
}

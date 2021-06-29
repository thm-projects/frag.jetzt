export interface CloudWeightSetting {
  /**
   * This field specifies how many elements of this weight are displayed.
   *
   * A number less than zero means that all elements of the weight are displayed.
   */
  maxVisibleElements: number;
  /**
   * CSS color property value.
   */
  color: string;
  /**
   * Rotation of each html element in degrees.
   *
   * null indicates random rotation.
   */
  rotation: number;
  allowManualTagNumber: boolean;
}

export type CloudWeightSettings = [
  CloudWeightSetting, // w1
  CloudWeightSetting, // w2
  CloudWeightSetting, // w3
  CloudWeightSetting, // w4
  CloudWeightSetting, // w5
  CloudWeightSetting, // w6
  CloudWeightSetting, // w7
  CloudWeightSetting, // w8
  CloudWeightSetting, // w9
  CloudWeightSetting  // w10
];

export enum CloudTextStyle {
  normal,
  lowercase,
  capitalized,
  uppercase
}

export interface CloudParameters {
  /**
   * The general font family for the tag cloud
   */
  fontFamily: string;
  /**
   * The general font style for the tag cloud
   */
  fontStyle: string;
  /**
   * The general font weight for the tag cloud
   */
  fontWeight: string;
  /**
   * The general font size for the tag cloud
   */
  fontSize: string;
  /**
   * Background color of the Tag-cloud
   */
  backgroundColor: string;
  /**
   * Color when hovering over the elements
   */
  fontColor: string;
  /**
   * Percentage values for the weight classes, by interpolation all classes are filled with values
   */
  fontSizeMin: number;
  /**
   * Percentage values fot the weight classes, by interpolation all classes are filled with values
   */
  fontSizeMax: number;
  /**
   * Describes scaling when hovering
   */
  hoverScale: number;
  /**
   * Time for hovering in ms
   */
  hoverTime: number;
  /**
   * Time before hover animation starts in ms
   */
  hoverDelay: number;
  /**
   * Time for delay in ms between each word during build-up
   */
  delayWord: number;
  /**
   * Enables random angles
   */
  randomAngles: boolean;
  /**
   * Sorts the cloud alphabetical.
   */
  sortAlphabetically: boolean;
  /**
   * Custom CSS text transform setting
   */
  textTransform: CloudTextStyle;
  /**
   * Array of settings for each weight group.
   */
  cloudWeightSettings: CloudWeightSettings;
}

const clone = (elem: any): any => {
  if (Array.isArray(elem)) {
    const copy = new Array(elem.length);
    for (let i = 0; i < elem.length; i++) {
      copy[i] = clone(elem[i]);
    }
    return copy;
  } else if (elem instanceof Object) {
    const copy = {};
    for (const key of Object.keys(elem)) {
      copy[key] = clone(elem[key]);
    }
    return copy;
  }
  return elem;
};

export const cloneParameters = (parameters: CloudParameters) => clone(parameters);

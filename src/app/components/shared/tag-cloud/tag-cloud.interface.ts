export interface TagCloudHeaderDataOverview {
  commentCount: number;
  userCount: number;
  tagCount: number;
}

export type CloudWeightCount = [
  number, // w1
  number, // w2
  number, // w3
  number, // w4
  number, // w5
  number, // w6
  number, // w7
  number, // w8
  number, // w9
  number // w10
];

export type CloudWeightColor = [
  string, // w1
  string, // w2
  string, // w3
  string, // w4
  string, // w5
  string, // w6
  string, // w7
  string, // w8
  string, // w9
  string // w10
];

export interface CloudParameters {
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
   * The count of cloud weights is used to limit the size of the displayed weighted elements.
   *
   * A number less than zero means that all elements of the weight are displayed.
   */
  cloudWeightCount: CloudWeightCount;
  /**
   * This array contains the CSS color property for each cloud weight
   */
  cloudWeightColor: CloudWeightColor;
}

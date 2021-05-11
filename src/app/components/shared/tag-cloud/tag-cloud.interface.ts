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
}

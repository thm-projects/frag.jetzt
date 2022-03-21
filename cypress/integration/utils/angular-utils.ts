type Options = Partial<Cypress.Loggable & Cypress.Timeoutable>;

export const xPathInMenuPanel = (xPath: string, options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/div[contains(@class, "mat-menu-panel")]' + xPath, options);
};

export const xPathInDialog = (xPath: string, options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/mat-dialog-container' + xPath, options);
};

export const xPathInSnackBar = (xPath: string = '', options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/snack-bar-container' + xPath, options);
};

export const xPathInTooltip = (xPath: string = '', options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/mat-tooltip-component', options);
};

export const xPathInCurrentActiveCdkOverlay = (xPath: string, options?: Options) => {
  return cy.xpath('//div[@class="cdk-overlay-container"]/div[last()]' + xPath, options);
};

type Options = Partial<Cypress.Loggable & Cypress.Timeoutable>;

export const xPathInMatSelectPanel = (xPath: string, options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/div[contains(@class, "mat-select-panel-wrap")][last()]' + xPath, options);
};

export const xPathInMenuPanel = (xPath: string, options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/div[contains(@class, "mat-menu-panel")][last()]' + xPath, options);
};

export const xPathInDialog = (xPath: string, options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/mat-dialog-container[last()]' + xPath, options);
};

export const xPathInSnackBar = (xPath: string = '', options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/snack-bar-container[last()]' + xPath, options);
};

export const xPathInTooltip = (xPath: string = '', options?: Options) => {
  return xPathInCurrentActiveCdkOverlay('/div/mat-tooltip-component[last()]', options);
};

export const xPathInCurrentActiveCdkOverlay = (xPath: string, options?: Options) => {
  return cy.xpath('//div[@class="cdk-overlay-container"]/div' + xPath, options);
};

export const disableTour = () => {
  localStorage.setItem('onboarding_default', '{"state":"finished"}');
};

export const ensureUserIsLoggedOut = () => {

  cy.get('#options-login-box').then(($container) => {

    //need to check first if user is already logged in after getting the #options-login-box container
    //using jQuery to check if login Button exists or session Button (when user is logged in)
    if($container.find('#login-button').length === 1 ) {
      //if user is not logged in assert that #login-button exists and #session-button not
      cy.get('#login-button').should('exist')
      cy.get('#session-button').should('not.exist')
    } else {
      //if user is already logged in assert that #login-button not exists and #session-button exists
      cy.get('#login-button').should('not.exist')
      cy.get('#session-button').should('exist')

      //open menu and logout user to continue with login process
      cy.get('#session-button').click();
      cy.get('.mat-menu-content').contains('logout').click()

      //assert that #login-button exists and #session-button not after logout
      cy.get('#login-button').should('exist')
      cy.get('#session-button').should('not.exist')
    }
  })
  cy.wait(500)
};


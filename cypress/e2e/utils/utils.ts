export const disableTour = () => {
  localStorage.setItem('currentLang', 'en');
  localStorage.setItem('onboarding_default', '{"state":"finished"}');
  localStorage.setItem('cookieAccepted', 'true');
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

export const mockCreatorTestRoom = () => {
  localStorage.setItem('loggedin', 'true');
  cy.get('@testRoomData').then(data => {
    localStorage.setItem('USER', data['roomOwnerUserData']);
    localStorage.setItem('ROOM_ACCESS', data['roomOwnerRoomAccess']);
  });
};

export const ensureTestRoomGenerated = (dataSetter: (value: any) => void) => {
  cy.visit('/home');
  cy.get('[id=new_session-button]').click();
  cy.get('mat-dialog-container').find('[name=roomName]').type('Cypress - Test', { force: true });
  cy.get('mat-dialog-container').find('.mat-slide-toggle-bar').click();
  cy.get('mat-dialog-container').find('.primary-confirm-button').click();
  const regex = /.+\/creator\/room\/([^/]+)\/?/i;
  cy.url({ timeout: 15_000 }).should('match', regex).then((url) => {
    const userData = localStorage.getItem('USER');
    const roomAccess = localStorage.getItem('ROOM_ACCESS');
    dataSetter({
      roomUrl: url,
      roomShortId: regex.exec(url)[1],
      roomOwnerUserData: userData,
      roomOwnerRoomAccess: roomAccess,
    });
  });
};

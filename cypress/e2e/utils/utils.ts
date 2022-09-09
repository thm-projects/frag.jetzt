export const disableTour = () => {
  localStorage.setItem('currentLang', 'en');
  localStorage.setItem('onboarding_default', '{"state":"finished"}');
  localStorage.setItem('cookieAccepted', 'true');
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

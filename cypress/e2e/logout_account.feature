Feature: Check if a user can logout from a guest session
  Login as a guest and then logout

  Scenario: Logout from a guest session
    Given I am on the home page and skipped dialogues
    Given I am logged in as a guest
    When I open the session menu
    Then I should see the logout button
    And I should be able to logout


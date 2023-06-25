Feature: Check if a user can login with credentials
  Ensure that user is not already logged in and then log in

  Scenario: Login to Account
    Given I am on the home page and skipped dialogues
    Given I am not logged in
    When I click on the login menu button
    Then I should see the login form
    And I should be able to login to my account


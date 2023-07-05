Feature: Test functionalities for a room
  This feature tests the basic functionalities of the room handling

  Scenario: Create a room as a guest user
    Given I am on the home page and skipped dialogues
    Given I am logged in as a guest
    When I click on the create room button
    Then The room creation form should be visible
    And I should be able to create a new room called "testRoom"
    Then I should see the room options
    And I should be able to save the options
    Then I should see the room overview

  Scenario: Delete a room for Cleanup
    Given I am on the home page and skipped dialogues
    Given that the test room will be deleted

  Scenario: Join a prepared room as a guest
    Given I am on the home page and skipped dialogues
    Given I am logged in as a guest
    When I am on the user page
    Then I should be able to join a prepared room with a room code



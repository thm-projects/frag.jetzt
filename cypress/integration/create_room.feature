Feature: Check if creating a room works
  Check if a user can create a room and route automatically to the creator page

  Scenario: creating room
    Given I am on the home page and skipped dialogues
    When I click on create a room
    And I enter the name "TestRoom" in the dialog
    And I click on create room in the dialog
    Then I will navigate to the creator page
    And The same name "TestRoom" is displayed on the page
    And The displayed code is part of the navigation

Feature: Test the room creator page
  Test all the functionalities of the session in creator role

  Scenario: Create a question
    Given I created the test room
    And I route to the QnA of the generated Test Room
    Given I do nothing
    When I click on the ask a question button
    And I write "This is a question" in the dialog
    And I press the send button
    Then I should see the same question

  Scenario: Delete a question
    Given I created the test room
    And I route to the QnA of the generated Test Room
    Given  I created the question "This is a question"
    When I click on the icon wrapper
    And I click on the delete icon
    And I confirm the dialog
    Then The question should be deleted

  Scenario: Edit room name
    Given I created the test room
    And I press the edit icon
    And I remove the current name
    And I write "Test"
    And I press the save button
    Then The room name should be "Test"

  Scenario: Delete room via menu panel
    Given I created the test room
    And I click on the menu panel
    And I click on delete room inside the panel
    And I confirm to delete the room
    And I click on the menu panel
    And I click on the sessions inside the panel
    Then The room should not exist

  Scenario: Delete room via session overview
    Given I am on the home page and skipped dialogues
    And I created the room "Test"
    And I go to the QnA
    Given I do nothing
    When I click on the menu panel
    And I click on the sessions button inside the panel
    And I click on the icon wrapper of the room
    And I click on delete the room
    And I confirm the deletion
    Then The room should not exist

Feature: Test the room creator page
  Test all the functionalities of the session in creator role

  Background:
    Given I am on the home page
    And I create the room "Test"
    And I join this room as creator

  Scenario: Ask a question
    Given I do nothing
    When I click on the ask a question button
    And I write "This is a question" in the dialog
    And I press the send button
    Then I should see the same question

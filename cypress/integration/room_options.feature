Feature: Test optional functionalities for a room
  This feature contains a test for the participant view

  Background:
    Given I am on the home page and skipped dialogues
    And I created the room "TestRoom"
    And I go to the QnA

  Scenario: Displayed room options should be reduced in participant view
    Given I do nothing
    When I click on the menu panel
    And I click on the participant view button
    Then The participant view icon should be visible on the top
    But The brainstorming option should not be visible

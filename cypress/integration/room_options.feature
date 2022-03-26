Feature: Test optional functionalities for a room
  This feature contains a test for the participant view

  Background:
    Given I created the test room
    And I route to the QnA of the generated Test Room

  Scenario: Displayed room options should be reduced in participant view
    Given I do nothing
    When I click on the menu panel
    And I click on the participant view button
    Then The participant view icon should be visible on the top
    But The brainstorming option should not be visible

  Scenario: Cleanup
    Given that the test room will be deleted

Feature: Test the bonus archive for the token usage
  This feature contains tests if the token is displayed in the archive
  and if the navigation to the linked question works correctly

  Background:
    Given I am on the home page and skipped dialogues
    And I created the room "TestRoom"
    And I go to the QnA
    And I created the question "TestQuestion"
    And The question is set with a bonus token

  Scenario: The bonus token is displayed in the archive
    Given I do nothing
    When I click on the menu panel
    And I click on the bonus archive icon
    Then The bonus token should be displayed

  Scenario: The bonus token in the archive is linked with the question
    Given I do nothing
    When I click on the menu panel
    And I click on the bonus archive icon
    And I click on the icon wrapper
    And I go to the question
    Then The question should be displayed


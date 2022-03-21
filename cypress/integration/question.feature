Feature: Test Question Behavior
  Question Behavior contains all question toggles and Question badge on the Q&A icon

  Background:
    Given I am on the home page and skipped dialogues
    And I created the room "TestRoom"
    And I go to the QnA
    And I created the question "TestQuestion"

  Scenario: Q&A badge displays question number
    Given I do nothing
    When I click the back button
    Then The badge should display the number "1"

  Scenario: Switch question tag wrong to correct
    Given I set the question to wrong
    When I mark the question as correct
    Then The correct icon should be marked
    But The wrong icon should not be marked

  Scenario: Toggle bonus token and bookmark
    Given I do nothing
    When I set the bonus token for the question
    And I set the bookmark
    Then The bonus token should be marked
    And the bookmark should be marked

  Scenario: Add category to question
    Given I do nothing
    When I click on the icon wrapper
    And I click on the category icon
    And I open the category overview
    And I choose a category
    And I save the chosen category
    Then The category icon should be visible on the question

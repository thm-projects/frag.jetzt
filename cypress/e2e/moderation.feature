Feature: Test the Moderation usage for questions

  Background:
    Given I created the test room
    And I route to the QnA of the generated Test Room
    And I created the question "TestQuestion"

  Scenario: Banned question should be removed from the Q&A
    Given I do nothing
    When I press on the banish icon
    Then The question should not exist in the QnA

  Scenario: Banned question should be visible in the moderation
    Given I do nothing
    When I press on the banish icon
    And I click on the menu panel
    And I click on the moderation button
    Then The question should be displayed

  Scenario: Cleanup
    Given that the test room will be deleted


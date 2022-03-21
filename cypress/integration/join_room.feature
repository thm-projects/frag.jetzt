Feature: Check if joining a room works
  Check if a participant can join the room "test"

  Scenario: joining room
    Given I am on the home page and skipped dialogues
    And The room "Test123" exists
    When I enter the id of this room
    And I press the join button
    Then I will navigate to its q&a-page as creator


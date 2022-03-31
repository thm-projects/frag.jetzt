Feature: Check if joining a room works
  Check if a participant can join the room "test"

  Scenario: joining room
    Given I created the test room
    When I enter the id of the test room
    And I press the join button
    Then I will navigate to its q&a-page as creator

  Scenario: Cleanup
    Given I created the test room
    Given that the test room will be deleted


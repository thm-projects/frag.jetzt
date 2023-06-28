Feature: Test basic functionalities of the chatGPT assistent
  This feature tests the basic functionalities of the chatGPT assistent

  Scenario: Use chatGPT assistent by sending him a prepared prompt as a guest user
    Given I am on the home page and skipped dialogues
    Given I have accepted cookies
    And I am logged in as a guest
    And I am on the overview of a prepared room
    When I open the chatGPT assistent
    Then I ask the assistent a prepared prompt
    And The assistent should answer the prompt
    And I should be able to assume the answer to the QnA forum of the room


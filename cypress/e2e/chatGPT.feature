Feature: Test basic functionalities of the chatGPT assistent
  This feature tests the basic functionalities of the chatGPT assistent

  Scenario: Use chatGPT assistent by sending him a prepared prompt as a guest user
    Given I am on the home page and skipped dialogues
    Given I am logged in as a guest
    Given I am on the overview of a prepared room
    When I open the chatGPT assistent
    Then I ask the assistent a prepared prompt
    And The assistent should answer the prompt



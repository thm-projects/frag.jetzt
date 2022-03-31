Feature: Check if the title is correct
    Display the index page and test if the title is correct

    Scenario: Index Page
        Given I am on the home page and skipped dialogues
        When I do nothing
        Then I should see the title

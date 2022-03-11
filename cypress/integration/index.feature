Feature: Check if the title is correct
    Display the index page and test if the title is correct

    Scenario: Index Page
        Given I am on the index page
        And I accept the privacy terms
        And I complete the tour guide
        When I do nothing
        Then I should see the title

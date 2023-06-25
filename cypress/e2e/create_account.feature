Feature: Check if a user can sign up to frag.jetzt
    Display the index page, create a user and test if the user can be created

    Scenario: Create a new Account
        Given I am on the home page and skipped dialogues
        Given I am not logged in
        When I click on the login menu button
        Then I should see the login form
        And I should be able to create a new user


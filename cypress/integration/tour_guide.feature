Feature: Check if the tour guide works
    Check if the tour guide displays all relevant steps when a user visits frag.jetzt

    Scenario: Tour guide pops up
        Given I am on the home page
        When I accept the privacy terms
        Then the tour guide pops up

    Scenario: Skipping tour guide via X-button
        Given the tour guide is visible
        When I click on the X button
        Then the tour guide should close

    Scenario: Skipping tour guide via ESC-button
        Given the tour guide is visible
        When I press the ESC-button
        Then the tour guide should close

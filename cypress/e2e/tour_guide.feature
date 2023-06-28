Feature: Check if the tour guide works
    Check if the tour guide has all relevant functionalities when a user visits frag.jetzt

    Scenario: Tour guide pops up
        Given I am on the home page
        Then the tour guide pops up

    Scenario: Skip the tour guide
        Given the tour guide is visible
        When I press the skip button
        Then the tour guide should close

    Scenario: Follow the tour guide
      Given the tour guide is visible
      When I press the accept button
      Then the tour guide should start

# How to contribute

We want to make this frontend as lightweight as possible while still providing a user friendly, engaging experience.

More information can be found in our [README.md](README.md).

## Getting Started

- Make sure you have a [THM GitLab account](https://git.thm.de/).
- Submit an issue for each task if one does not already exist.
- Clearly describe the issue, including steps to reproduce it if it is a bug.

## Making Changes

- Create a topic branch on which to base your work.
  - This should always be the master branch, unless something has gone terribly wrong.
  - Use tags to describe your issue/branch/merge request.
  - Always provide information about what you are working on.
  - To quickly create a topic branch, go to your issue, expand `Create merge request` and select `Create branch`.
- Make logical and atomic commits.
- Check for unnecessary whitespace with `git diff --check` before committing.
- Create tests for your changes if possible (yes, it takes time, it is annoying, but it is also _necessary_).
- Run _all_ the tests to make sure nothing else is broken by accident.

## Submitting changes

- Push your changes to a topic branch in the repository.
- Check that your topic branch is up to date with `staging'. If not, rebase your branch.
- Submit a merge request to the repository.
- Check that your changes meet all the [Definition of Done](DoD.md) criteria.
- Provide information about what has changed.
- Mark your merge request as `Ready for testing` when you have finished your work. If you haven't already done so, mark it as `work in progress` and add `[WIP]:` to the merge request title.
- The team will then test your changes. If everything is as expected, your merge request will be marked as `Ready for Review`.
- The Scrum Master will then review your code for style and compatibility. If all is well, your changes will be merged.
- If something goes wrong - do not panic! There will be a change request with more information about what went wrong. You can fix those problems, and your merge request will remain open.

## Git commit messages

- Use the present tense (`Add feature` instead of `Added feature`).
- Use imperative mood (`Move cursor to....` instead of `Moves cursor to...`).
- Limit the first line to 72 characters or less.
- Reference issues and merge requests liberally after the first line.

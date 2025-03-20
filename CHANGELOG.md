# Changelog

All notable changes to this project will be documented in this file.

## Table of Contents

- [1.2.1](#121)
- [1.2.0](#120)
- [1.1.0](#110)

## [1.2.1]

### Fixed

- Icons in room view for both roles

### Contributors

- Project management: Klaus Quibeldey-Cirkel
- Lead programming: Tom "tekay" Käsler, Lukas Mauß

## [1.2.0]

### Added

- Counter for comments
- Badge in comment view counting comments / filtered comments
- Guest login for speaker role

### Improved

- Enabled Angular Ahead-of-Time compiler
- Improved loading strategy for Service Workers
- Optimized dark theme for better readability
- Pinned searchbar for comments to the top
- Added ID and local time to header component in comment view
- Improved overall wording

### Changed

- Toolbar for comments only shows when there are more than 3 comments

### Fixed

- Closing presentation view for comments on pressing ESC when in browser fullscreen
- Scrolling in room settings

### Contributors

- Project management: Klaus Quibeldey-Cirkel
- Lead programming: Tom "tekay" Käsler, Lukas Mauß

## [1.1.0]

### Added

- Comment Feature:
  - Interaction via WebSockets
  - Voting on comments by participants
  - New attributes: read, favorite, correct
  - Search function
  - Sorting and filtering
  - Presentation mode with color indication for participants
  - Threshold to hide negative comments from participant and lecturer
- Progressive Web App functionality for a 'native app' feeling
- Theme Manager with 4 Themes to choose from

### Improved

- Various design improvements

### Contributors

- Project management: Klaus Quibeldey-Cirkel
- Lead programming: Tom "tekay" Käsler, Lukas Mauß

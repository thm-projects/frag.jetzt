# frag.jetzt

Nomen est omen: The app's name says it all (German for »ask.now«): It stands for both the app's main purpose and its web address <https://frag.jetzt>

[![Quality Gate Status](https://scm.thm.de/sonar/api/project_badges/measure?project=de.thm.arsnova%3Afrag-jetzt-frontend&metric=alert_status)](https://scm.thm.de/sonar/dashboard?id=de.thm.arsnova%3Afrag-jetzt-frontend)

## 📚 Table of Contents

- [🚀 Developer Onboarding Guide](#developer-onboarding-guide)
- [👨‍🏫 Mentoring & Support](#mentoring--support)
- [📝 Introduction](#introduction)
- [⚙️ Core Functionalities](#core-functionalities)
- [🏗️ Project Architecture](#project-architecture)
- [💻 Setting Up the Development Environment](#setting-up-the-development-environment)
- [💻 Understanding the Codebase](#understanding-the-codebase)
- [🤝 Contribution and Collaboration Guidelines](#contribution-and-collaboration-guidelines)
- [✅ Definition of Done Checklist](#definition-of-done-checklist-for-user-stories)
- [📜 Project History](#project-history)
- [📋 Project Documentation](#project-documentation)
- [❓ Troubleshooting FAQ](#troubleshooting-faq)

# Developer Onboarding Guide

🎉 Welcome to the frag.jetzt dev community!

Your contributions are invaluable to continuously improving our interactive educational tools. Let's innovate together! 🎉 🌍 👩‍💻

## Mentoring & Support

We strongly believe in supporting new contributors through mentoring to facilitate an effective and welcoming onboarding experience.

- **Project Mentoring and General Guidance:**  
  Prof. Dr. Klaus Quibeldey-Cirkel (Project Lead) – [klaus.quibeldey@gmail.com](mailto:klaus.quibeldey@gmail.com)

- **Technical Mentoring and Chief Developer:**  
  Ruben Bimberg (M.Sc.) – [ruben.bimberg@mni.thm.de](mailto:ruben.bimberg@mni.thm.de)

If you need assistance, have technical questions, or require general support, please open an issue on our [GitLab issue tracker](https://gitlab.arsnova.eu/arsnova/frag.jetzt/-/issues).

Do not hesitate to reach out—we're happy to help!

## Introduction

**frag.jetzt** is an open-source Progressive Web Application (PWA) developed by Technische Hochschule Mittelhessen (THM) to facilitate interactive Q&A sessions and enhance audience engagement in educational settings. The platform supports collaborative educational interactions through moderated, real-time, multilingual dialogue and incorporates advanced AI-driven features. It adheres strictly to ethical frameworks and data protection standards, including GDPR compliance.

## Core Functionalities

### AI-Based Moderation

- Advanced moderation using AI and contextual pipelines, effectively managing inappropriate content.

### Interactive Keyword Cloud

- Real-time thematic visualizations using NLP technologies for improved navigation and interaction.

### Multilingual Support and Compliance

- Comprehensive multilingual functionality combined with stringent ethical and data protection compliance.

### Retrieval-Augmented Generation (RAG)

- Enhances AI-generated content, providing accurate and contextually relevant interactions.

## Project Architecture

frag.jetzt employs a modular architecture comprising:

- **Frontend Layer:** Developed using Angular and TypeScript, optimized as a Progressive Web Application (PWA) ensuring accessibility, cross-platform compatibility, and enhanced user experience.
- **Backend Layer:** Provides core functions such as managing Q&A sessions, moderating content, and supporting multilingual processing.
- **AI Integration:** Incorporates cutting-edge Natural Language Processing (NLP) technologies like GPT-based Large Language Models (LLMs), vector embeddings, and Retrieval-Augmented Generation (RAG), enhancing content moderation and user interactions.

## Setting Up the Development Environment

### Required Software

Before starting, ensure the following software components are installed:

- **Operating System**: Recommended to use GNU/Linux distributions:

  - Debian-based (Debian, Ubuntu, Mint)
  - Arch-based (Arch Linux, Manjaro)
  - Red Hat-based systems (RHEL, Fedora, CentOS)

  _Note_: Using Windows Subsystem for Linux 2 (WSL2) is possible but may have limitations, such as handling file events.

- **Node.js**: Install Node.js, preferably managed via a version manager like [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating).

- **Docker and Docker Compose**: Required for orchestrating the necessary backend services and dependencies.

### macOS Specific Instructions

If Docker credential errors arise (`ERROR: failed to solve: error getting credentials - err: exit status 1`), adjust your Docker configuration as follows:

```bash
nano ~/.docker/config.json
```

Change `"credsStore": "desktop"` to `"credsStore": "osxkeychain"`.

## frag.jetzt Development with Dependencies

frag.jetzt consists of a large number of backend services. To simplify the process, a startup script is available via `npm run docker`.

### Running Locally

If you have installed all prerequisites (1. - 3.), you can run frag.jetzt with `npm run docker`. After the initial setup phase and some questions, you will be prompted with five options:

- `1` to start or fully update all dependencies.
- `2` for subsequent starts in development.
- `3` to stop all containers.
- `4` to see the current logs of the process (Important! It can be very helpful to see what is being compiled and where errors are).
- `5` to delete all Docker data from your system.

An admin account is available with email `admin@admin` and password `admin`.

### Running with Staging Server

If the resources of your computer are limited, you can also run only the frontend and use the resources of the currently running [staging version](https://staging.frag.jetzt). This way is only recommended for frontend development.

You can do this by executing `npm run staging`.

There is no admin account available and you must log in with a guest account.
This process runs directly on your terminal, so you do not need to explicitly view the logs or terminate the process.
You can simply cancel the process to end it (usually with <kbd>Ctrl + C</kbd>).

### Access frag.jetzt

If you did not change any ports, the application is now available under [localhost:4200](http://localhost:4200).

All emails from the system are intercepted and can be viewed in the Mailhog interface at [localhost:8025](http://localhost:8025/).

### Static Code Analysis

To run a local statuc code check with [SonaQube](https://www.sonarsource.com/), follow these steps:

1. switch into the analysis folder  
   `cd analysis`
2. start the SonaQube server  
   `docker-compose up -d sonarqube`
3. when SonaQube has started, you may run analysis whenever you want with  
   `docker-compose run --rm analysis`

## Understanding the Codebase

Our codebase is organized into several key components that work together to deliver the frag.jetzt experience:

### Frontend Architecture

- **Core Module**: Contains essential services, models, and utilities used throughout the application
- **User Module**: Handles authentication, user profiles, and session management
- **Room Module**: Manages the creation and configuration of Q&A sessions
- **Question Module**: Implements question creation, voting, and moderation features
- **AI Module**: Integrates NLP capabilities for content moderation and keyword extraction

### Key Files and Entry Points

- `app.module.ts`: Main application module that bootstraps the application
- `app-routing.module.ts`: Defines the application's route structure
- `environment.ts`: Contains environment-specific configuration variables
- `services/http.service.ts`: Central service for handling API communications

### Development Workflows

- **Adding a New Feature**: Start by creating a feature branch from `staging`, implement your changes, add tests, and submit a merge request
- **Fixing a Bug**: Identify the root cause using the browser console and server logs, create a fix branch, implement and test your solution
- **Modifying UI Components**: Follow our component structure using [Angular Material](https://material.angular.io/) and ensure responsive design across all device sizes

## Contribution and Collaboration Guidelines

- **Issue Tracking:** Document bugs or feature requests clearly in GitLab.
- **Branch Management:** Branch from the `staging` branch for features and bug fixes.
- **Commit Standards:** Follow concise, descriptive commit messages in imperative mood and adhere to project style standards (ESLint, Prettier).
- **Testing Protocol:** Consistently write and run unit tests (Karma) and end-to-end tests (Cypress).

### Definition of Done Checklist for User Stories

Ensure each completed User Story meets the following criteria:

1. **Cross-browser Compatibility:**  
   The feature is tested against all acceptance criteria in Chrome, Firefox, and Safari.

2. **Performance Analysis:**  
   The feature does not regress in any category of the [Lighthouse Analysis](https://developer.chrome.com/docs/lighthouse/overview/), except possibly »Performance«.

3. **Responsive Design:**  
   The feature is fully responsive on all screens, from small smartphones to large 4K displays.

4. **Accessibility:**  
   The feature is accessible and fully usable on all supported devices and screen sizes.

5. **Multilingual Support:**  
   The feature is available in all supported languages (English, French, and German). Translations must be completed using [DeepL](https://www.deepl.com/translator).

6. **Tooltips:**  
   All icons and toggle buttons include descriptive tooltips.

7. **Theme Compatibility:**  
   The feature maintains visual consistency and usability across all available themes.

8. **Branch Integration:**  
   The feature branch has been successfully merged with the `staging` branch.

9. **Merge Request:**  
   A merge request to the `staging` branch has been created and clearly documented.

10. **Conflict Resolution:**  
    The merge request has no conflicts and merges cleanly into `staging`.

11. **Peer Code Review:**  
    The code has been reviewed and approved by at least one developer external to the original development team.

12. **Product Owner Approval:**  
    The product owner has been assigned and has reviewed the merge request.

13. **Technical Debt Assessment:**  
    Code quality and technical debt have been assessed with [SonarQube](https://sonar.arsnova.eu). Ensure technical debt has not significantly increased due to recent commits.

## Project History

### Vision Statement (version 2024)

**AI-Enhanced Educational Interactions: Towards Next-Generation Learning**

In 2024, we successfully built upon the robust foundation and widespread adoption of frag.jetzt as a premier interactive platform by leveraging cutting-edge AI technologies, including Retrieval-Augmented Generation (RAG) and advanced Large Language Models (LLMs). Our primary focus was integrating these technologies to transform frag.jetzt from a conventional interactive platform into a sophisticated intelligent assistant. We successfully facilitated deeply adaptive and individualized learning paths, significantly enhancing educational outcomes and accessibility on a global scale. Through these strategic innovations, frag.jetzt solidified its position at the forefront of intelligent educational technology.

### Vision Statement (version 2023)

**Dual-Mode Learning Platform: The Evolution of frag.jetzt from ARS to PLE**

In 2023, we set forth an ambitious plan to evolve frag.jetzt from its roots as a reliable Audience Response System (ARS) into an AI-supported Personal Learning Environment (PLE). Our goal was to attract a broader user base by offering customizable learning environments and seamless transitions between educator and learner roles. This transition significantly enriched user engagement, expanded our audience, and established a dynamic and diverse educational ecosystem.

### Vision Statement (version 2022)

**Pioneering Audience Engagement through Interactive and Gamified Learning**

In 2022, our goal with the innovative platform frag.jetzt was to lead the market of audience response systems specifically designed for educational environments. Our browser-based, GDPR-compliant Q&A platform leveraged gamified incentives, such as bonus points for quality questions, to foster interactive and anonymous participation. This unique approach significantly boosted classroom engagement, laying a strong foundation for future innovations and growth.

## Project Documentation

- Glossary: [PDF](https://git.thm.de/arsnova/frag.jetzt/-/raw/staging/docs/diagrams/Glossary.pdf)

- Use Case Diagram: [SVG](https://staging.frag.jetzt/assets/images/Use_Case_Diagram.svg)

- Domain Diagram: [SVG](https://staging.frag.jetzt/assets/images/Domain_Diagram.svg)

- Activity Diagram for Bonus Awarding: [SVG](https://staging.frag.jetzt/assets/images/activity_diagram_bonus_option.svg)

- Activity Diagram for Brainstorming: [SVG](https://staging.frag.jetzt/assets/images/activity_diagram_brainstorming.svg)

- frag.jetzt Backend: [Swagger](https://frag.jetzt/api/webjars/swagger-ui/index.html)

## Troubleshooting FAQ

### Common Issues and Solutions

| Issue                               | Possible Cause                        | Solution                                                                       |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Docker containers fail to start     | Port conflicts with existing services | Check if ports 4200, 8080, or 27017 are already in use and stop those services |
| Frontend compilation errors         | Outdated Node.js version              | Ensure you're using the recommended Node.js version (see Requirements section) |
| Authentication fails in development | Email verification issues             | Check Mailhog at localhost:8025 for verification emails                        |
| Changes not reflecting in browser   | Browser caching                       | Hard refresh (Ctrl+F5) or clear browser cache                                  |
| Database connection errors          | PostgreSQL container not running      | Run `docker ps` to check container status and restart if needed                |

### Debugging Tips

- Check the browser console (F12) for frontend errors
- Review Docker logs with `npm run docker` and selecting option 4
- For backend issues, check the Spring Boot logs in the terminal
- Enable verbose logging by setting `DEBUG=true` in your environment variables

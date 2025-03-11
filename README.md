# frag.jetzt

Nomen est omen: The app's name says it all: it stands for both the app's main purpose and its web address <https://frag.jetzt>

[![Quality Gate Status](https://scm.thm.de/sonar/api/project_badges/measure?project=de.thm.arsnova%3Afrag-jetzt-frontend&metric=alert_status)](https://scm.thm.de/sonar/dashboard?id=de.thm.arsnova%3Afrag-jetzt-frontend)

# frag.jetzt Developer Onboarding Guide

## Introduction

**frag.jetzt** is an open-source Progressive Web Application (PWA) developed by Technische Hochschule Mittelhessen (THM) to facilitate interactive Q&A sessions and enhance audience engagement in educational settings. The platform supports collaborative educational interactions through moderated, real-time, multilingual dialogue and incorporates advanced AI-driven features. It adheres strictly to ethical frameworks and data protection standards, including GDPR compliance.

## Project Architecture

frag.jetzt employs a modular architecture comprising:

- **Frontend Layer:** Developed using Angular and TypeScript, optimized as a responsive Progressive Web Application (PWA) ensuring accessibility, cross-platform compatibility, and enhanced user experience.
- **Backend Layer:** Provides core functions such as managing Q&A sessions, moderating content, and supporting multilingual processing.
- **AI Integration:** Incorporates cutting-edge Natural Language Processing (NLP) technologies like GPT-based LLMs, vector embeddings, and Retrieval-Augmented Generation (RAG), enhancing content moderation and user interactions.

## Setting Up the Development Environment

### Required Software

Before starting, ensure the following software components are installed:

- **Operating System**: Recommended to use GNU/Linux distributions:

  - Debian-based (Debian, Ubuntu, Mint)
  - Arch-based (Arch Linux, Manjaro)
  - Red Hat-based systems (RHEL, Fedora, CentOS)

  _Note_: Using Windows Subsystem for Linux 2 (WSL2) is possible but may have limitations, such as handling file events.

- **Node.js**: Install Node.js, preferably managed via a version manager like NVM.

- **Docker and Docker Compose**: Required for orchestrating the necessary backend services and dependencies.

### macOS Specific Instructions

If Docker credential errors arise (`ERROR: failed to solve: error getting credentials - err: exit status 1`), adjust your Docker configuration as follows:

```bash
nano ~/.docker/config.json
```

Change `"credsStore": "desktop"` to `"credsStore": "osxkeychain"`.

## frag.jetzt development with dependencies

frag.jetzt consists of a large number of backend services. To simplify the process, a startup script is available via `npm run docker`.

### Prerequisite

The following software has to be installed on your computer:

1. GNU/Linux compliant operating system, for example:
   1. Debian based: Debian, Ubuntu, Mint, ...
   2. Arch based: Arch, Manjaro, ...
   3. Red Hat based: Red Hat, RHEL, Fedora, CentOS, ...
   4. ...
   5. WSL 2 at your own risk (sometimes e.g. file events are not supported)
2. Node
   - It is recommended to install a Version Manager for Node.
   - For example: [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
3. Docker (Docker Compose shipped with Docker)
   - You can either install Docker Desktop or Docker Engine.
   - Docker Desktop is easier for beginners.
   - The script will warn you if you do not have installed some dependencies.
4. For Mac users: If the script displays an error message with `ERROR: failed to solve: error getting credentials - err: exit status 1, out:`, check your Docker configuration (`cat ~/.docker/config.json`) and change your "credsStore" from "desktop" to "osxkeychain" (You could use `nano ~/.docker/config.json`).

### Running locally

If you have installed all prerequisites (1. - 3.), you can run frag.jetzt with `npm run docker`. After the initial setup phase and some questions, you will be prompted with some options.
Click `1` to start or fully update all dependencies. Click `2` for subsequent starts in development. Click `3` to stop all containers. Click on `4` to see the current logs of the process (Important! It can be very helpful to see what is being compiled and where errors are).
Click on `5` to delete all Docker data from your system.

An admin account is available with email `admin@admin` and password of `admin`.

### Running with Staging Server

If the resources of your computer are limited, you can also run only the frontend and use the resources of the currently running staging version. (This version is only recommended for frontend development).
You can do this by executing `npm run staging`.

There is no admin account available and you must log in with a guest account.
This process runs directly on your terminal, so you do not need to explicitly view the logs or terminate the process.
You can simply cancel the process to end it (usually with <kbd>Ctrl + C</kbd>).

## Access frag.jetzt

If you did not change any ports, the application is now available under [localhost:4200](http://localhost:4200).

All emails from the system are intercepted and can be viewed in the Mailhog interface at [localhost:8025](http://localhost:8025/).

## Code style analysis

To run a local code style check with sonarqube, follow these steps:

1. switch into the analysis folder  
   `cd analysis`
2. start the sonarqube server  
   `docker-compose up -d sonarqube`
3. when sonarqube has started, you may run analysis whenever you want with  
   `docker-compose run --rm analysis`

## Core Functionalities

### AI-Based Moderation

- Advanced moderation using AI and contextual pipelines, effectively managing inappropriate content.

### Interactive Keyword Cloud

- Real-time thematic visualizations using NLP technologies for improved navigation and interaction.

### Multilingual Support and Compliance

- Comprehensive multilingual functionality combined with stringent ethical and data protection compliance.

### Retrieval-Augmented Generation (RAG)

- Enhances AI-generated content, providing accurate and contextually relevant interactions.

## Contribution and Collaboration Guidelines

- **Issue Tracking:** Document bugs or feature requests clearly in GitLab.
- **Branch Management:** Branch from the `staging` branch for features and bug fixes.
- **Commit Standards:** Follow concise, descriptive commit messages in imperative mood and adhere to project style standards (ESLint, Prettier).
- **Testing Protocol:** Consistently write and run unit tests (Karma) and end-to-end tests (Cypress).

## Further Resources

- **Live Application:** [frag.jetzt](https://frag.jetzt)
- **Source Repository:** [arsnova/frag.jetzt](https://gitlab.arsnova.eu/arsnova/frag.jetzt)
- **Docker Setup:** [Docker Orchestration Repository](https://gitlab.arsnova.eu/arsnova/frag.jetzt-docker-orchestration)
- **Documentation:** Extensive project documentation, including architecture diagrams and data models, is available in the repository.

We look forward to your valuable contributions to the frag.jetzt project—join us in advancing interactive and intelligent educational tools.

## Vision Statement (2023)

**Dual-Mode Learning Platform: The Evolution of frag.jetzt from ARS to PLE**

With our tried-and-true open-source software frag.jetzt, we have established a robust Audience Response System (ARS) that is utilized as Software-as-a-Service (https://frag.jetzt) by numerous educators at colleges and universities in Germany, Austria, and Switzerland (the DACH region). Equipped with a variety of integrated teaching and learning tools, frag.jetzt has established itself in digital teaching settings. However, the journey is far from over. Despite the positive resonance, we are committed to pushing the boundaries of what is possible and expanding to a broader user base. The previous focus on the educator demographic has constrained the expansion of our user base. We recognize the immense potential that unfolds once an educator discovers the platform and integrates it into their teaching. To fully harness this potential, we have an ambitious vision: the transformation of frag.jetzt into an AI-supported Personal Learning Environment (PLE) for a wide user group.

The core of the next release is the comprehensive refactoring of frag.jetzt from an ARS to a PLE, to cater to both educators and learners. The first encounter with the frag.jetzt platform will be a defining moment as users will have the choice to utilize the platform either as an ARS for educators or a PLE for learners. We are firmly convinced that this groundbreaking realignment, opening up frag.jetzt as a personal learning environment, will exponentially increase the number of users. A central incentive of our realignment is the integration of ChatGPT as an AI tutor in personal virtual rooms, with a dedicated room created for each subject. This innovative approach will make frag.jetzt a magnet for a broader user base, dramatically enhancing our influence and reach in the educational landscape.

---

## Vision Statement (2022)

With our innovative product "frag.jetzt" we want to conquer the market of audience response systems. With "frag.jetzt," we are addressing teachers at schools and universities. With "frag.jetzt," we offer a browser-based, privacy-compliant Q&A app for anonymous, silent questioning. The unique selling point is the option to award "good questions" for earning bonuses. Studies show that active participation in class is significantly boosted by silent questions. Bonuses for good questions as extrinsic learning motivation reinforce this effect.

## Features

1. There are four roles in the app: "Room creator", "Moderator", "Participant" and "Administrator". Each role allows the creation of any number of rooms. The moderator role can be assigned by the creator of a room to people who have registered. In addition, the moderator role can be temporarily assigned to guests by creating a special room key or link. In any role with access to a given room, posts can be made anonymously and others' posts can be read. Only the administrator can compose and publish messages for all users of the app.

1. When creating a room, the room creator can choose whether all questions should be moderated or published directly, whether a profanity filter should be active, whether the quiz app "arsnova.click", the bonus option or the brainstorming option should be activated.

1. After entering the room key or by scanning the QR code, participants can ask their questions and rate others' questions with +1 or -1. The question board can be moderated. Room creators or moderators can set a threshold for automatic publication of a question, i.e., at what rating a question is displayed on the question board. The threshold can be set between -100 and 0 rating points.

1. To make a question, answer, or comment as readable and understandable as possible, the AI translation program [DeepL](https://www.deepl.com/pro-api?cta=header-pro-api) translates the text into a foreign language and back into the original language at the user's request. The back translation is in almost all cases better than the original in terms of spelling, grammar, punctuation, and language style. For the languages German, French, Italian, Spanish, Dutch, Portuguese, Polish and Russian, back-translation can be done in two ways: informally (German: Duzen) or formally (German: Siezen). The language of the entered text is automatically determined by the [LanguageTool](https://languagetool.org/http-api/#!/default/post_check) software.

1. A lecturer can award bonus points for questions that are goal-oriented and lecture-related. Good questions earn a star, and the student finds an 8-digit code ("bonus token") for each star in their bonus archive. The tokens can be redeemed for bonus points by emailing the instructor. The lecturer or his moderators can validate the submitted bonus tokens with the awarded ones in their bonus archive.

1. Instructors and moderators can affirm, deny, answer, star, or ban questions to the moderation board. Questions on the moderation board can be released individually. Only room creators can delete questions, but only if they do not have a bonus star. All other users can only delete their own questions.

1. Every user can sort the question board according to the criteria "newest question first", "downward or upward by rating points" and "degree of controversy". The board can be searched, and the questions can be filtered. The following filter criteria are available: bonus-awarded, conversations, bookmarked, answered by the room creator, answered by a moderator, unanswered, question number, censored, and own questions. In addition, the question stream can be paused, i.e., new questions are only displayed if the user releases the question stream again.

1. Room creators and moderators can define categories ("tags") for questions in the room settings. The person asking can then tag their question with one of the predefined categories. Categorized questions can be filtered by clicking on the tag. Room creators and moderators can also tag questions afterwards.

1. Room creators and moderators have the option to enable all questions for anonymous commenting. The comments then appear as a conversation offset to the side below the respective question.

1. Each user can call up a notification board where their own questions are listed as soon as they have received a reaction: for example, if they have been commented on, answered in the affirmative, denied, banned, published or deleted.

1. There is a presentation mode called "Question Focus" that allows each user to view the questions individually in full view. Also, new questions can be displayed automatically in the "Auto Focus" mode.

1. There is a navigation mode called "Question Radar". The radar locates questions based on keywords generated in real time by the NLP software [spaCy](https://spacy.io/) using a grammatical analysis of the sentences entered. Afterwards, "frag.jetzt" checks whether the generated keywords are also keyworded on [Wikipedia](https://dumps.wikimedia.org/). The larger and more central a keyword appears on the radar, the more numerous or significant the associated questions are.

1. Any user can export all questions with their answers, comments, and tags. The room creator and moderators can also export the moderated questions. If bonuses have been awarded, the associated bonus codes are also in the export table.

1. Registered users can be informed about new questions and answers by mail. Weekday and time of the mail notification are adjustable.

1. The user interface meets the requirements for readability according to [WCAG 2.1 AA](https://www.w3.org/TR/WCAG21/). Appropriate display options are available for beamer presentation and for visually impaired persons. In particular, the font size of the questions can be scaled. In addition to the room code, a room can also be entered via an automatically generated direct link.

1. Any number of rooms can be created as guest or registered user. Only the rooms of registered users remain permanently. 180 days after the last use of a room, it will be deleted automatically. Bonus tokens of unregistered participants are only stored in the browser cache. If the browser cache is deleted, the tokens are lost. Before leaving a session as an unregistered person, they will be asked to export their acquired tokens as a mail draft or save them to the clipboard.

1. Although an ordinary website, it behaves like an app from the App Store. It can be installed from the browser: "Add to Home". After that, it launches like a regular app. As a [Progressive Web App (PWA)](https://en.wikipedia.org/wiki/Progressive_web_app), it runs on any smartphone, no matter what operating system, no matter what browser. So the audience will always be ready to use "frag.jetzt" on the spot and spontaneously.

1. Every user who has used "frag.jetzt" interactively, for example by creating a room or asking a question, can rate the app with stars. The rating scheme follows that of Amazon.

## Glossary

See [PDF](https://git.thm.de/arsnova/frag.jetzt/-/raw/staging/docs/diagrams/Glossary.pdf)

## Use Case Diagram

See [SVG](https://staging.frag.jetzt/assets/images/Use_Case_Diagram.svg)

## Domain Diagram

See [SVG](https://staging.frag.jetzt/assets/images/Domain_Diagram.svg)

## Activity Diagram for Bonus Awarding

See [SVG](https://staging.frag.jetzt/assets/images/activity_diagram_bonus_option.svg)

## Activity Diagram for Brainstorming

See [SVG](https://staging.frag.jetzt/assets/images/activity_diagram_brainstorming.svg)

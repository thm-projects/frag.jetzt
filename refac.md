# Project Refactoring (WIP)

## 1. Example - Styles

**(1.1)** Component Style is mostly not influenced by the implementation of Angular Themes. They are overwritten, resulting in side effects, when working with Angular Material Components.
e.g.: when removing Style of the home-page.component in scss

<details>
<summary>Example <b>(1.2)</b></summary>
![image](/uploads/4759d11f886598f6705361601e803c6b/image.png)
</details>
<details>
<summary>Example <b>(1.3)</b></summary>
![image](/uploads/587f99c8a023cc581ef7efdd64746092/image.png)
</details>

> Although they are Dark Themes, the underlying Material Theme is not. By creating new Components, the style needs to be adjusted manually for every Theme.

**(1.4)** Implementation of Components for features must be non-reliant on those effects, so that:

- the Theme defines colors
- the implementation of the Component defines Layout.

**(1.5)** If further customization is required, a strategy for material overrides must be defined, so that:

- No Side-Effects appear for other Components.

### strategy for color-names

// TODO

### usage of multiple color code notations

e.g.: ![image](/uploads/69eaa9d5cfe8aec7f66ea835d99574c0/image.png)

preferred format should be `RED, GREEN, BLUE` instead of `FULL_NAME` or `#FFFFFF`,
reason: with this notation `RED, GREEN, BLUE`, `rgba(var(--color),0.-1)` can be used. it allows to automatically generate accent colors.

if full names or hex codes are still required, a preprocessor can be used to generate scss entries.

## 2. Component Scope

**(2.1)** The reuse of components has advantages. DRY - Principle
However, if a Component includes several subcomponents, if those subcomponents have properties in context to the parent Component, those subcomponents cannot be used for other Components.

**(2.2)** e.g.:\
**app-room-join** is used by different components.\
If requirements change:\
_e.g.: form-field to be full width, or button should be different,_
there's no elegant way to use this component in new components.

<details>
<summary>Example <b>(2.3)</b></summary>
![image](/uploads/792c4caf38d48fdf5606283b59c62346/image.png)
</details>

<details>
<summary>Example <b>(2.4)</b></summary>
![image](/uploads/ad73fa94c567a55aac9cbc13ebe38825/image.png)
</details>

> ## Issue
>
> The main issue here is, there's a lot of effort in these components, but their style is dependant on their functionality vice versa.

> ## Possible Solution
>
> A possible solution might be:
>
> - when creating a subcomponent, don't use style on that subcomponent, so that:
>   1. the subcomponent only implements the functionality
>   2. the parent component controls the layout style
>   3. the theme controls the component coloring.

## 3 Translation

**(3.1)** Different components import different language files (_type: json_).\
This is an Issue, when reusing components. A subcomponent uses the translation of the parent (if not otherwise specified, which itself is a workaround, to this issue).
E.g.: For every cancel button, the translation has to be redone resulting in countless duplicate entries, for a translation.

<details>
<summary>Example <b>(3.2)</b></summary>
![image](/uploads/992b96d1e3336228a06094d18d531b19/image.png)
</details>

> ## Issue
>
> 1. trivial translations have to be defined for every new component.
> 2. side effects when reusing components

> ## Possible Solution
>
> 1. common pool for translations
> 2. introduction of new pipe for common pool translations

## 4 Brand Identity & Design

(No need to go fancy here)\
A design choice can only be justified, with a common goal. Otherwise, it's highly subjective.
Considering the target audience for this project, it's important to keep this in mind.
It should create a lasting impression on the target audience.

> ## Issue
>
> 1. no definition of 'corporate design'
>    1. constant overwriting of components ⇒ crude implementation ⇒ no goal ⇒ non-maintainable code
> 2. different design philosophies
>    1. material design framework, but forcing a unique selling point by overwriting said framework, resulting in different design approaches
> 3. too many colors and themes (no brand colors, difficult to maintain, bad implementation, side-effects e.g.: changing background-color, changes text color in a non-related component)
> 4. too many elements, that don't serve a purpose ⇒ which is irritating for users? (those elements need to be maintained)
>    1. why is it (maybe, potentially) irritating for some users?\
>       User uses product during critical moments, overcomplicating (and constantly changing) UI elements will hinder that behaviour.\
>       Also the learning curve for new users gets too steep. (normal users don't have the context developers have)
>
> ## Solution
>
> 1. define a design which serves as benchmark for every future implementation
>    1. create components based on that design
>    2. use those components for features
>    3. stay on track, don't lose scope
>    4. don't overcomplicate features
>       1. **if an implementation of a feature takes too long due to overcomplicating and micromanaging the design, ultimately the feature release will be delayed**, it's important to release a feature as fast as possible and then evaluate whether additional features are really necessary. It's important to get feedback from active and new users regarding future features or other requests. (This excludes anecdotal requests)
>
> scratch notes:
>
> - When does a feature become a new Application
> - How to handle anecdotal requests? _CRM_
> - Provide resources for target audience e.g.: https://www.jetbrains.com/help/
>   - Link features within the web app to those resources e.g.:
>   - user uses certain feature, link article describing features or insights https://www.jetbrains.com/help/idea/work-with-maven-goals.html
>   - provide user with options to migrate from other system e.g.: https://www.jetbrains.com/help/idea/migrating-from-eclipse-to-intellij-idea.html
>   - provide educational templates / articles about how to integrate a feature in lectures e.g.: https://www.jetbrains.com/help/idea/product-educational-tools.html
>   - always provide help (**see s.1**)

<details>
<summary>Example <b>(s.1)</b></summary>
![image](/uploads/6dc663f65660c6566c18dc39fb69b474/image.png)
</details>

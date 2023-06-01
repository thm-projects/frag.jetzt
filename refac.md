# Project Refactoring

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

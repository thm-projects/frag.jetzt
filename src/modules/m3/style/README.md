# Material 3 SCSS Library

This library provides SCSS utilities to implement Material 3 (M3) design principles, including typography, layout, elevation, motion, shape, and dynamic theming. It integrates directly with Angular Material components and allows for customizable, responsive, and theme-aware design.

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
   - [Initializing the Styles](#initializing-the-styles)
4. [Typography](#typography)
   - [Typescale Usage](#typescale-usage)
   - [Responsive Typography](#responsive-typography)
5. [Layout](#layout)
   - [Window Classes & Explicit Range](#window-classes--explicit-range)
6. [Shape](#shape)
7. [Motion](#motion)
8. [Elevation](#elevation)
9. [Dynamic Theme Service](#dynamic-theme-service)

---

## Overview

This SCSS library provides M3-based styles and tokens, allowing developers to easily integrate M3 design principles into their Angular applications. It supports dynamic theming, responsive layouts, and applies the M3 tokens like color, typography, and motion.

---

## Installation

To install the library:

1. Clone the repository or add it as a submodule to your project.
2. Ensure you have Angular Material installed, as this library extends the Material components.

```bash
npm install @angular/material
```

---

## Getting Started

### Initializing the Styles

The `m3-initializer.scss` file provides all the necessary style inclusions for the project. To begin using the styles in your application, include the initializer in your global SCSS:

```scss
@use "path-to-your-library/style/m3-initializer.scss" as m3-init;

@include m3-init.load();
```

This will include all necessary styles, such as typography, layout, and theme tokens, and apply them globally to your Angular project.

---

## Typography

The library provides typography mixins based on Material 3’s typescale. You can easily apply these styles to your components using the `m3-typescale` mixins.

### Typescale Usage

To apply a typescale, use the mixin and specify the type (e.g., `headline`, `body`, `label`) and size (e.g., `large`, `medium`, `small`).

```scss
.title {
  @include m3-typescale.typescale(display, large);
}

.sub-title {
  @include m3-typescale.typescale(body, medium);
}
```

The available types include:

- `display`
- `headline`
- `body`
- `label`

The sizes for each type are `large`, `medium`, and `small`, allowing for flexible design choices.

---

### Responsive Typography

The library supports responsive typography with `explicit-range` media queries, simplifying how you manage typography across different screen sizes.

```scss
.title {
  @include m3-layout.explicit-range(compact, medium) {
    @include m3-typescale.typescale(display, medium);
  }
  @include m3-layout.explicit-range(expanded) {
    @include m3-typescale.typescale(display, large);
  }
}
```

This example scales the typography based on the screen size, adjusting the display type from `medium` to `large`.

---

## Layout

The `m3-layout.scss` file provides a responsive layout system based on window classes like `compact` and `expanded`. These classes are mapped to specific screen widths and allow for adaptive layouts without manual media queries.

### Window Classes & Explicit Range

To apply layout changes based on screen size, use the `explicit-range` mixin. It simplifies media query management and lets you design for different ranges in the Material 3 breakpoints.

```scss
.container {
  display: flex;
  @include m3-layout.explicit-range(expanded) {
    flex-direction: row;
  }
  @include m3-layout.explicit-range(compact) {
    flex-direction: column;
  }
}
```

The available ranges are:

- `compact`
- `medium`
- `expanded`

---

## Shape

Define component shapes like corner radius using the shape tokens provided in `m3-shape.scss`.

```scss
.card {
  border-radius: var(--md-sys-shape-corner-large-end);
}
```

This token-based approach ensures consistent corner styling across the entire project.

---

## Motion

In `m3-motion.scss`, you’ll find motion tokens that define easing curves and transition durations. Apply these tokens to ensure smooth animations that follow Material 3 principles.

```scss
@import "path-to-library/style/m3-motion";

.element {
  transition: transform 0.3s var(--md-sys-motion-easing-emphasized);
}
```

You can easily use or extend these motion tokens for various animations and transitions in your application.

---

## Elevation

Although not fully implemented, the `m3-elevation.scss` file is designed to manage the elevation (z-axis placement) of components. Elevation will adjust the component’s shadow and surface properties.

---

## Dynamic Theme Service

The library includes a dynamic theme service to manage the M3 color scheme. This service allows developers to change the primary palette or adjust the hue dynamically.

### Service Example

To use the theme service, inject it into your Angular component and apply the desired theme:

```typescript
constructor(private themeService: M3DynamicThemeService) {}

changeTheme(color: string) {
  this.themeService.loadColor(color);
}
```

This will dynamically update the theme using Material 3 tokens.

---

## Conclusion

This library aims to simplify the integration of Material 3 in Angular applications by providing easy-to-use SCSS utilities for typography, layout, and theming. For further customization or detailed examples, refer to the individual SCSS files within the library.

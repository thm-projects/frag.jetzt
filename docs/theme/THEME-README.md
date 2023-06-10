# How to add a new Theme

Here are some helpful tools:

[M3 Theme Builder](https://m3.material.io/theme-builder#/custom)

[Color Palette Builder](https://m2.material.io/design/color/the-color-system.html#tools-for-picking-colors)

[Component Theming](https://material.angular.io/guide/theming-your-components)

## Preparation

Create a new directory with the name of the new theme in src/theme.

## Create new theme

1. Create a new scss file with the same structure as `_dark-theme.scss` and style it using material palette.

2. Create a new scss file in your working theme directory named {YourThemeName}.const.ts and copy the structure of `darkTheme.const.ts`.

## Add new theme to theme manager

Import the file in `styles.scss` and add the new theme to theme menu in `header.component.html`.

## Configure your theme

Start editing the variables and see the magic happen. We recommend to use [material colors](https://m2.material.io/tools/color).

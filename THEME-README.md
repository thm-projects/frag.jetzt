# How to add a new Theme

## Preparation

Create a new directory with the name of the new theme in src/theme.

## Create new theme

1. Create a new scss file with the same structure as `_dark-theme.scss` and style it using material palette.

2. Create a new scss file in your working theme directory named {YourThemeName}.const.ts and copy the structure of `darkTheme.const.ts`.

## Add new theme to theme manager

Import the file in `styles.scss` and add the new theme to theme menu in `header.component.html`.

## Configure your theme 

Start editing the variables and see the magic happen. We recommend to use [material colors](https://material.io/tools/color).

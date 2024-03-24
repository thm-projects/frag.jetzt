import { hexFromArgb, Theme } from '@material/material-color-utilities';

export interface M3PaletteRequirement {
  [key: string]: number[];
}

export interface M3CustomColorData {
  [key: string]: {
    base: string;
    variations: number;
  };
}

export interface M3DynamicColorState {
  prev: M3DynamicColorState | undefined;
  current: string;
}

export type M3ThemeType = 'light' | 'dark';

export function isM3ThemeType(type: string): type is M3ThemeType {
  return type === 'light' || type === 'dark';
}

const _PaletteKeyToTheme = {
  'neutral-variant': 'neutralVariant',
};

const _ColorGroupToKey = {
  color: '$',
  onColor: 'on-$',
  colorContainer: '$-container',
  onColorContainer: 'on-$-container',
};

export const M3DynamicThemeUtility = {
  mapPaletteRequirement(
    theme: Theme,
    paletteRequirements: M3PaletteRequirement,
  ): [string, string][] {
    return Object.entries(paletteRequirements)
      .map(
        ([key, value]) =>
          [
            key,
            value.map((tone) => [
              tone,
              theme.palettes[_PaletteKeyToTheme[key] || key].tone(tone),
            ]),
          ] as [string, [number, number][]],
      )
      .flatMap(([key, tones]) =>
        tones.map(
          ([tone, color]) =>
            [`--md-ref-palette-${key}${tone}`, hexFromArgb(color)] as [
              string,
              string,
            ],
        ),
      );
  },
  applyTheme(config: {
    themeType: M3ThemeType;
    theme: Theme;
    paletteRequirements: M3PaletteRequirement;
    target: HTMLElement;
    customColors?: M3CustomColorData;
  }) {
    for (const [key, value] of M3DynamicThemeUtility.mapPaletteRequirement(
      config.theme,
      config.paletteRequirements,
    )) {
      config.target.style.setProperty(key, value);
    }
    if (config.customColors) {
      for (const custom of config.theme.customColors) {
        // const origin = config.customColors[custom.color.name];
        const colorGroupElement = custom[config.themeType];
        for (const [key, value] of Object.entries(colorGroupElement)) {
          config.target.style.setProperty(
            `--md-sys-color-${_ColorGroupToKey[key].replace(
              '$',
              custom.color.name,
            )}`,
            hexFromArgb(value as number),
          );
        }
      }
    }
  },
};

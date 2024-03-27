/**
 * @deprecated
 */
export class Palette {
  public static RED: string = 'var(--red)';
  public static YELLOW: string = 'var(--yellow)';
}

/**
 * @deprecated
 */
export class ColorElem {
  public on: ColorElem;
  public variant: ColorElem;

  constructor(
    public name: string,
    public attr: string,
    public color: string,
  ) {}
}

/**
 * @deprecated
 */
type LanguageTranslations = ThemeMeta['translation']['name'];

/**
 * @deprecated
 */
export class ThemeTranslationList {
  map: string[][] = [];

  /**
   * @deprecated
   */
  constructor(
    private name,
    translation: LanguageTranslations,
  ) {
    for (const k of Object.keys(translation)) {
      this.map.push([k, translation[k]]);
    }
  }

  /**
   * @deprecated
   */
  public get(language: string) {
    for (const mapEntry of this.map) {
      if (mapEntry[0] === language) {
        return mapEntry[1];
      }
    }
    console.error(
      'ThemeTranslationList: Translation Error, Unknown Language: ' + language,
    );
    return 'unknown';
  }
}

/**
 * @deprecated
 */
export interface ThemeMeta {
  translation: {
    name: {
      en: string;
      de: string;
      fr: string;
    };
  };
  isDark: boolean;
  availableOnMobile: boolean;
  order: number;
  scale_desktop: number;
  scale_mobile: number;
  previewColor: string;
  config?: Record<string, unknown>;
  icon: string;
  isUtility?: boolean;
}

/**
 * @deprecated
 */
export class Theme {
  /**
   * Colors with on-color
   * Example:
   * primary -> '--primary' and '--on-primary'
   * @deprecated
   */
  public static mainColors: string[] = [
    'primary',
    'secondary',
    'background',
    'surface',
  ];

  /**
   * Colors with variant-color
   * Example:
   * primary -> '--primary' and 'primary-variant'
   * @deprecated
   */
  public static variantColors: string[] = ['primary', 'secondary'];

  /**
   * All Colors
   * @deprecated
   */
  public colors: ColorElem[];

  /**
   * All Colors from Theme.mainColors
   * @deprecated
   */
  public main: ColorElem[];

  /**
   * order:
   * used for Array.sort, for correct display of Themes
   * @deprecated
   */
  public order: number;

  /**
   * name:
   * name of Theme
   * @deprecated
   */
  public name: ThemeTranslationList;

  /**
   * previewColor:
   * used for Color-Icon in Footer
   * @deprecated
   */
  public previewColor: ColorElem;

  /**
   * scale:
   * Used for Initial Rescale value,
   * when Theme is loaded
   * @deprecated
   */
  public scaleDesktop: number;

  /**
   * scale:
   * Used for Initial Rescale value,
   * when Theme is loaded
   * @deprecated
   */
  public scaleMobile: number;

  /**
   * isDark:
   * used for dark/light switch in ars-lib
   * @deprecated
   *
   */
  public isDark: boolean;

  /**
   * @deprecated
   */
  public config: Record<string, unknown>;

  /**
   * @deprecated
   */
  public icon: string;

  /**
   * @deprecated
   */
  constructor(
    public key: string,
    public palette: Record<string, string>,
    public meta: ThemeMeta,
  ) {
    /*Init order*/
    this.order = meta['order'];

    /*Init name*/
    this.name = new ThemeTranslationList(
      'name',
      this.meta['translation']['name'],
    );

    /*Init scale*/
    this.scaleDesktop = this.meta['scale_desktop'];
    this.scaleMobile = this.meta['scale_mobile'];

    /*Init isDark*/
    this.isDark = this.meta['isDark'];

    this.icon = this.meta['icon'];
    /*Init all ColorElem*/

    this.colors = [];
    this.main = [];
    for (const k of Object.keys(palette)) {
      if (k !== 'name') {
        this.colors.push(new ColorElem(k.slice(2, k.length), k, palette[k]));
      }
    }

    if (!this.meta?.isUtility) {
      Theme.mainColors.forEach((e) => {
        this.get(e).on = this.get('on-' + e);
        this.main.push(this.get(e));
      });

      Theme.variantColors.forEach((e) => {
        this.get(e).variant = this.get(e + '-variant');
      });
    } else {
      this.get(this.meta['previewColor']).on = this.get(
        'on-' + this.meta['previewColor'],
      );
    }

    this.previewColor = this.get(this.meta['previewColor']);
  }

  /**
   * @deprecated
   */
  public get(name: string): ColorElem {
    return this.colors.find((c) => c.name === name);
  }

  /**
   * @deprecated
   */
  public getName(language: string): string {
    return this.name.get(language);
  }

  /**
   * @deprecated
   */
  public getPreviewColor(): string {
    return this.previewColor.color;
  }

  /**
   * @deprecated
   */
  public getOnPreviewColor(): string {
    return this.previewColor.on.color;
  }

  /**
   * @deprecated
   */
  public getScale(deviceType: string): number {
    switch (deviceType) {
      case 'desktop':
        return this.scaleDesktop;
      case 'mobile':
        return this.scaleMobile;
      default:
        console.error('unknown device type: ' + deviceType);
    }
    return undefined;
  }

  /**
   * @deprecated
   */
  public toString(language: string): string {
    if (typeof language === 'undefined') {
      return 'waiting for language (currentLang)';
    }
    return this.name.get(language);
  }
}

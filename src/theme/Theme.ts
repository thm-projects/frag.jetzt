export class Palette {
  public static RED: string = 'var(--red)';
  public static YELLOW: string = 'var(--yellow)';
}

export class ColorElem {

  public on: ColorElem;
  public variant: ColorElem;

  constructor(
    public name: string,
    public attr: string,
    public color: string
  ) {
  }

}

type LanguageTranslations = ThemeMeta['translation']['name'];

export class ThemeTranslationList {

  map: string[][] = [];

  constructor(private name, translation: LanguageTranslations) {
    for (const k in translation) {
      if (translation.hasOwnProperty(k)) {
        this.map.push([k, translation[k]]);
      }
    }
  }

  public get(language: string) {
    for (const mapEntry of this.map) {
      if (mapEntry[0] === language) {
        return mapEntry[1];
      }
    }
    console.error('ThemeTranslationList: Translation Error, Unknown Language: ' + language);
    return 'unknown';
  }

}

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
  config?: any;
  icon: string;
  isUtility?: boolean;
  highlightJsClass?: string;
}

export class Theme {

  /**
   * Colors with on-color
   * Example:
   * primary -> '--primary' and '--on-primary'
   */
  public static mainColors: string[] = [
    'primary',
    'secondary',
    'background',
    'surface'
  ];

  /**
   * Colors with variant-color
   * Example:
   * primary -> '--primary' and 'primary-variant'
   */
  public static variantColors: string[] = [
    'primary',
    'secondary'
  ];

  /**
   * All Colors
   */
  public colors: ColorElem[];

  /**
   * All Colors from Theme.mainColors
   */
  public main: ColorElem[];

  /**
   * order:
   * used for Array.sort, for correct display of Themes
   */
  public order: number;

  /**
   * name:
   * name of Theme
   */
  public name: ThemeTranslationList;

  /**
   * description:
   * description of Theme
   */
  public description: ThemeTranslationList;

  /**
   * previewColor:
   * used for Color-Icon in Footer
   */
  public previewColor: ColorElem;

  /**
   * scale:
   * Used for Initial Rescale value,
   * when Theme is loaded
   */
  public scaleDesktop: number;

  /**
   * scale:
   * Used for Initial Rescale value,
   * when Theme is loaded
   */
  public scaleMobile: number;

  /**
   * isDark:
   * used for dark/light switch in ars-lib
   *
   */
  public isDark: boolean;

  public config: any;

  public icon: string;

  constructor(
    public key: string,
    public palette: any,
    public meta: ThemeMeta
  ) {

    /*Init order*/
    this.order = meta['order'];

    /*Init name*/
    this.name = new ThemeTranslationList(
      'name', this.meta['translation']['name']
    );

    /*Init description*/
    this.description = new ThemeTranslationList(
      'description', this.meta['translation']['description']
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
    for (const k in palette) {
      if (palette.hasOwnProperty(k)) {
        if (k !== 'name') {
          this.colors.push(new ColorElem(
            k.slice(2, k.length),
            k,
            palette[k]
          ));
        }
      }
    }

    if (!this.meta?.isUtility) {
      Theme.mainColors.forEach(e => {
        this.get(e).on = this.get('on-' + e);
        this.main.push(this.get(e));
      });

      Theme.variantColors.forEach(e => {
        this.get(e).variant = this.get(e + '-variant');
      });
    } else {
      this.get(this.meta['previewColor']).on = this.get('on-' + this.meta['previewColor']);
    }

    this.previewColor = this.get(this.meta['previewColor']);
  }

  public get(name: string): ColorElem {
    return this.colors.find(c => c.name === name);
  }

  public getName(language: string): string {
    return this.name.get(language);
  }

  public getDescription(language: string): string {
    return this.description.get(language);
  }

  public getPreviewColor(): string {
    return this.previewColor.color;
  }

  public getOnPreviewColor(): string {
    return this.previewColor.on.color;
  }

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

  public toString(language: string): string {
    if (typeof language === 'undefined') {
      return 'waiting for language (currentLang)';
    }
    return this.name.get(language) + ' - ' + this.description.get(language);
  }
}








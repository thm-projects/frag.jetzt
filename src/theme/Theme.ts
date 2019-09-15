

export class ColorElem {

  public on: ColorElem;
  public variant: ColorElem;

  constructor(
    public name: string,
    public attr: string,
    public color: string
  ) {}

}

export class ThemeTranslationList {

  map: string[][] = [];

  constructor(private name, translation: Object) {
    for (const k in translation) {
      if (translation.hasOwnProperty(k)) {
        this.map.push([k, translation[k]]);
      }
    }
  }

  public get(language: string) {
    for (let i = 0; i < this.map.length; i++) {
      if (this.map[i][0] === language) {return this.map[i][1]; }
    }
    console.error('ThemeTranslationList: Translation Error, Unknown Language: ' + language);
    return 'unknown';
  }

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
  public scale: number;

  constructor(
    public key: string,
    public palette: Object,
    public meta: Object
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
    this.scale = this.meta['scale'];

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

    Theme.mainColors.forEach(e => {
      this.get(e).on = this.get('on-' + e);
      this.main.push(this.get(e));
    });

    Theme.variantColors.forEach(e => {
      this.get(e).variant = this.get(e + '-variant');
    });
    this.previewColor = this.get(this.meta['previewColor']);
  }

  public get(name: string): ColorElem {
    for (let i = 0; i < this.colors.length; i++) {
      if (this.colors[i].name === name) {return this.colors[i]; }
    }
    return null;
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

  public toString(language: string): string {
    if (typeof language === 'undefined') {return 'waiting for language (currentLang)'; }
    return this.name.get(language) + ' - ' + this.description.get(language);
  }
}








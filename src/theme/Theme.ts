

export class ColorElem {

  public on: ColorElem;
  public variant: ColorElem;

  constructor(
    public name: string,
    public attr: string,
    public color: string
  ) {}

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

  constructor(
    public key: string,
    public name: string,
    public description: string,
    public previewColor: string,
    public palette: Object,
    public order: number
  ) {

    this.colors = [];
    this.main = [];

    for (const k in palette) {
      if (palette.hasOwnProperty(k)) {
        if (k !== 'name' && k !== description) {
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

  }

  public get(name: string): ColorElem {
    for (let i = 0; i < this.colors.length; i++) {
      if (this.colors[i].name === name) {return this.colors[i]; }
    }
    return null;
  }

  public toString(): string {
    return this.name + ' - ' + this.description;
  }



}

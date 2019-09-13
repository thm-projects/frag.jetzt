

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

  public order:number;
  public name:ThemeTranslationList;
  public description:ThemeTranslationList;
  public previewColor:string;

  constructor(
    public key: string,
    public palette: Object,
    public meta: Object
  ) {
    this.order=meta['order'];
    this.name=new ThemeTranslationList(
      'name',this.meta['translation']['name']
    );
    this.description=new ThemeTranslationList(
      'description',this.meta['translation']['description']
    );
    this.previewColor=this.palette['--primary'];
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
  }

  public get(name: string): ColorElem {
    for (let i = 0; i < this.colors.length; i++) {
      if (this.colors[i].name === name) {return this.colors[i]; }
    }
    return null;
  }

  public getName(language:string):string{
    return this.name.get(language);
  }

  public getDescription(language:string):string{
    return this.description.get(language);
  }

  public getPreviewColor():string{
    return this.previewColor;
  }

  public getOnPreviewColor():string{
    return this.get('primary').on.color;
  }

  public getSecondaryColor():string{
    return this.get('secondary').color;
  }

  public toString(): string {
    return this.name + ' - ' + this.description;
  }
}

export class ThemeTranslationList{

  map:string[][]=[];

  constructor(private name,translation:Object){
    for(let k in translation){
      if(translation.hasOwnProperty(k)){
        this.map.push([k,translation[k]]);
      }
    }
  }

  public get(language:string){
    for(let i=0;i<this.map.length;i++){
      if(this.map[i][0]===language)return this.map[i][1];
    }
    console.error('ThemeTranslationList: Translation Error, Unknown Language: '+language);
    return 'unknown';
  }

}








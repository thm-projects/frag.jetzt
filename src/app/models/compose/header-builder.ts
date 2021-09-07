import { ArsMatMenuItemConfig } from '../../../../projects/ars/src/lib/compose/elements/mat-menu-item/ars-mat-menu-item-config';
import { HeaderService } from '../../services/util/header.service';
import { ArsMatToggleConfig } from '../../../../projects/ars/src/lib/compose/elements/mat-toggle/ars-mat-toggle-config';

export interface HeaderBuildable {

  button(e:ArsMatMenuItemConfig):void;
  toggle(e:ArsMatToggleConfig):void;

}

export class HeaderBuilder {

  private destroyListener:(()=>void)[]=[];

  constructor(private headerService:HeaderService){
  }

  private append(a:()=>void){
    this.destroyListener.push(a);
  }

  public build(a:(e:HeaderBuildable)=>void) {
    a({
      button:e=>this.append(this.headerService.createOption(e)),
      toggle:e=>this.append(this.headerService.createToggle(e))
    });
  }

  public destroy() {
    this.destroyListener.forEach(e=>e());
  }

}

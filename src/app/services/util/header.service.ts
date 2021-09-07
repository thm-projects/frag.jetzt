import { EventEmitter, Injectable } from '@angular/core';
import { ArsMatMenuItemConfig } from '../../../../projects/ars/src/lib/compose/elements/mat-menu-item/ars-mat-menu-item-config';
import { HeaderComponent } from '../../components/shared/header/header.component';
import { Destroyable } from '../../../../projects/ars/src/lib/models/util/Destroyable';
import { TranslateService } from '@ngx-translate/core';
import { ArsMatToggleConfig } from '../../../../projects/ars/src/lib/compose/elements/mat-toggle/ars-mat-toggle-config';
import { HeaderBuildable, HeaderBuilder } from '../../models/compose/header-builder';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  private userActivity:number;
  private userActivityListener:((v:number)=>void)[]=[];
  private userActivityToggle:boolean;
  private userActivityToggleListener:((v:boolean)=>void)[]=[];
  private headerComponent:()=>HeaderComponent;

  constructor() {}

  public initHeader(headerComponent:()=>HeaderComponent){
    this.headerComponent=headerComponent;
  }

  public setCurrentUserActivity(e:number){
    if(this.userActivity!=e){
      this.userActivity=e;
      if(this.userActivityToggle){
        this.userActivityListener.forEach(f=>f(this.userActivity));
      }
    }
  }

  public toggleCurrentUserActivity(e:boolean){
    if(this.userActivityToggle!=e){
      this.userActivityToggle=e;
      this.userActivityToggleListener.forEach(f=>f(this.userActivityToggle));
    }
  }

  public onUserChange(f:(v:number)=>void){
    this.userActivityListener.push(f);
  }

  public onActivityChange(f:(v:boolean)=>void){
    this.userActivityToggleListener.push(f);
  }

  /**
   * @see HeaderComponent
   */
  public createOption(e:ArsMatMenuItemConfig):Destroyable{
    if (!this.headerComponent) return null;
    const ref = this.headerComponent().createOption(e);
    return () => {
      this.headerComponent().host.viewContainerRef.remove(
        this.headerComponent().host.viewContainerRef.indexOf(ref.hostView));
    }
  }

  /**
   * @see HeaderComponent
   */
  public createOptions(list:ArsMatMenuItemConfig[]):Destroyable{
    const ref = [];
    list.forEach(e=>ref.push(this.createOption(e)));
    return ()=>ref.forEach(e=>e());
  }

  public createToggle(e:ArsMatToggleConfig):Destroyable{
    if (!this.headerComponent) return null;
    const ref = this.headerComponent().createToggle(e);
    return () => {
      this.headerComponent().host.viewContainerRef.remove(
        this.headerComponent().host.viewContainerRef.indexOf(ref.hostView));
    }
  }

  public createToggles(list:ArsMatToggleConfig[]):Destroyable{
    const ref = [];
    list.forEach(e=>ref.push(this.createToggle(e)));
    return ()=>ref.forEach(e=>e());
  }

  public getTranslate():TranslateService{
    return this.headerComponent().getTranslate();
  }

  public buildHeader(e:(a:HeaderBuildable)=>void,
                     onDestroyListener:EventEmitter<void>){
    const builder:HeaderBuilder=new HeaderBuilder(this);
    builder.build(e);
    onDestroyListener.subscribe(()=>builder.destroy());
  }

}

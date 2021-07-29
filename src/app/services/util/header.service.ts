import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  private userActivity:number;
  private userActivityListener:((v:number)=>void)[]=[];
  private userActivityToggle:boolean;
  private userActivityToggleListener:((v:boolean)=>void)[]=[];


  constructor() {}

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

}

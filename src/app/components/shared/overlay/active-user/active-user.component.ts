import {AfterViewInit,Component,Input,OnDestroy,OnInit,ViewChild} from '@angular/core';
import {Room} from '../../../../models/room';
import {ActiveUserService} from '../../../../services/http/active-user.service';
import {HeaderService} from '../../../../services/util/header.service';

@Component({
  selector:'app-active-user',
  templateUrl:'./active-user.component.html',
  styleUrls:['./active-user.component.scss']
})
export class ActiveUserComponent implements OnInit,OnDestroy{

  @Input() room: Room;
  @Input() iconColor: string;
  @Input() foregroundColor: string;
  @Input() backgroundColor: string;
  @Input() left: number;
  @Input() top: number;
  @ViewChild('divElement') elem: HTMLElement;
  activeUser=0;
  onDestroyListener: (() => void)[]=[];
  onValueChangeListener: ((user: number) => void)[]=[];
  deviceType;

  constructor(
    private activeUserService: ActiveUserService,
    private headerService: HeaderService
  ){
    this.deviceType=localStorage.getItem('deviceType');
  }

  ngOnInit(): void{
    if(this.deviceType&&this.deviceType==='mobile'){
      this.headerService.toggleCurrentUserActivity(true);
      this.onDestroyListener.push(()=>this.headerService.toggleCurrentUserActivity(false));
      this.onValueChangeListener.push(num=>this.headerService.setCurrentUserActivity(num));
    }
    this.onDestroyListener.push(
      this.activeUserService.observeUserActivity(this.room,user=>{
        if(user!==null){
          this.activeUser=user;
          this.onValueChangeListener.forEach(e=>e(user));
        }
      })
    );
  }

  ngOnDestroy(){
    this.onDestroyListener.forEach(e=>e());
  }

}

import {Component,Input,OnDestroy,OnInit,ViewChild} from '@angular/core';
import {Room} from '../../../../models/room';
import {HeaderService} from '../../../../services/util/header.service';
import { RoomDataService } from '../../../../services/util/room-data.service';

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
  @Input() alwaysShowInHeader: boolean;
  @ViewChild('divElement') elem: HTMLElement;
  activeUser = '?';
  onDestroyListener: (() => void)[]=[];
  onValueChangeListener: ((userCount: string) => void)[]=[];
  deviceType;
  showByComponent: boolean;

  constructor(
    private headerService: HeaderService,
    private roomDataService: RoomDataService,
  ){
    this.deviceType=localStorage.getItem('deviceType');
  }

  ngOnInit(): void{
    if(this.deviceType&&(this.deviceType==='mobile'||this.alwaysShowInHeader)){
      this.showByComponent=false;
      this.headerService.toggleCurrentUserActivity(true);
      this.onDestroyListener.push(()=>this.headerService.toggleCurrentUserActivity(false));
      this.onValueChangeListener.push(userCount => this.headerService.setCurrentUserActivity(userCount));
    } else{
      this.showByComponent=true;
    }
    const sub = this.roomDataService.observeUserCount().subscribe(value => {
      this.activeUser = value;
      this.onValueChangeListener.forEach(e => e(value));
    });
    this.onDestroyListener.push(() => sub.unsubscribe());
  }

  ngOnDestroy(){
    this.onDestroyListener.forEach(e => e());
  }

}

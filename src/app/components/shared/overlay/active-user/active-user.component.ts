import {AfterViewInit,Component,Input,OnDestroy,OnInit,ViewChild} from '@angular/core';
import {Room} from '../../../../models/room';
import {ActiveUserService} from '../../../../services/http/active-user.service';

@Component({
  selector: 'app-active-user',
  templateUrl: './active-user.component.html',
  styleUrls: ['./active-user.component.scss']
})
export class ActiveUserComponent implements OnInit, OnDestroy{

  @Input()room:Room;
  @Input()iconColor:string;
  @Input()foregroundColor:string;
  @Input()backgroundColor:string;
  @ViewChild('divElement')elem:HTMLElement;
  activeUser:number=0;
  onDestroyListener:(()=>void)[]=[];

  constructor(
    private activeUserService:ActiveUserService
  ) { }

  ngOnInit(): void {
    this.onDestroyListener.push(
      this.activeUserService.observeUserActivity(this.room,user=>{
        if(user!==null){
          this.activeUser=user;
        }
      })
    );
  }

  ngOnDestroy(){
    this.onDestroyListener.forEach(e=>e());
  }

}

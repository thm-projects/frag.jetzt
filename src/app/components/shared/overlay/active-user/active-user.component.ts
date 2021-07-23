import {AfterViewInit,Component,Input,OnInit,ViewChild} from '@angular/core';
import {Room} from '../../../../models/room';
import {ActiveUserService} from '../../../../services/http/active-user.service';

@Component({
  selector: 'app-active-user',
  templateUrl: './active-user.component.html',
  styleUrls: ['./active-user.component.scss']
})
export class ActiveUserComponent implements OnInit{

  @Input()room:Room;
  @Input()iconColor:string;
  @Input()foregroundColor:string;
  @Input()backgroundColor:string;
  @ViewChild('divElement')elem:HTMLElement;
  activeUser:number;

  constructor(
    private activeUserService:ActiveUserService
  ) { }

  ngOnInit(): void {
    this.activeUserService.getActiveUser(this.room).subscribe(i=>{
      if(i&&i.length>0){
        this.activeUser=i[0];
      }
    });
  }

}

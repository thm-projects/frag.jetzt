import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ArsComposeService } from '../../../../services/ars-compose.service';
import { ArsComposeHostDirective } from '../../../../compose/ars-compose-host.directive';
import { ArsObserver } from '../../../../models/util/ars-observer';
import { TranslateService } from '@ngx-translate/core';
import { ArsDateFormatter, ArsTimeUnit } from '../../../../services/ars-date-formatter.service';

@Component({
  selector: 'ars-date-test',
  templateUrl: './date-test.component.html',
  styleUrls: ['./date-test.component.scss']
})
export class DateTestComponent implements OnInit,AfterViewInit {

  @ViewChild(ArsComposeHostDirective) host:ArsComposeHostDirective;

  private observe:ArsObserver<Date>;
  public results:string[];

  constructor(
    public builder:ArsComposeService,
    public translate:TranslateService,
    public arsDateFormatter:ArsDateFormatter
  ) {
    this.results=[];
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(){
    this.builder.builder(this.host,e=>{
      e.button({
        translate:this.translate,
        callback:()=>{
          const fun1=(e:Date)=>console.log(this.arsDateFormatter.format(this.arsDateFormatter.approximateDate(e),'de'));
          const fun2=(e:Date)=>console.log(this.arsDateFormatter.format(this.arsDateFormatter.approximateDate(e),'de'));
          const date=new Date();
          console.log(date.getSeconds());
        },
        title:'test',
      });
      e.datePicker({
        translate:this.translate,
        appearance:'fill',
        change:ArsObserver.build(e=>{
          this.observe=e;
          e.onChange(value=>{
            console.log(this.arsDateFormatter.format(this.arsDateFormatter.approximateDate(value.get()),'en'));
          })
        }),
        title:''
      });
    });
  }

  onchange(e:any){
    this.observe.set(new Date(e.target.value))
  }

}

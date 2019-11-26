import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'ars-resp',
  templateUrl: './resp.component.html',
  styleUrls: ['./resp.component.scss']
})
export class RespComponent implements OnInit, AfterViewInit {

  @Input() width: number;
  @Input() margin: number;
  @Input() fillHeight: boolean;

  constructor(public ref: ElementRef, public render: Renderer2) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (this.width) {
      this.render.setStyle(this.ref.nativeElement.children[0], 'width', this.width + 'px');
    }
    if (this.margin) {
      this.render.setStyle(this.ref.nativeElement.children[0], 'margin', '0px ' + this.margin + 'px 0px ' + this.margin + 'px');
    }
    if (this.fillHeight) {
      this.render.setStyle(this.ref.nativeElement.children[0], 'height', 100 + '%');
      this.render.setStyle(this.ref.nativeElement, 'height', 100 + '%');
    }
  }

}

import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { Motd } from '../../../../../models/motd';

@Component({
  selector: 'app-motd-message',
  templateUrl: './motd-message.component.html',
  styleUrls: ['./motd-message.component.scss']
})
export class MotdMessageComponent implements OnInit, AfterViewInit {

  @Input() message: Motd;
  @ViewChild('markdown', { static: true }) markdown: any;
  translatedMessage: string;

  constructor() {
  }

  ngOnInit(): void {
    if (localStorage.getItem('currentLang') === 'de') {
      this.translatedMessage = this.message.msgGerman;
    } else {
      this.translatedMessage = this.message.msgEnglish;
    }
  }

  public setIsRead(isRead: boolean) {
    this.message.setIsRead(isRead);
  }

  ngAfterViewInit(): void {
    Array.from<HTMLElement>(this.markdown.element.nativeElement.children).forEach(e => e.tabIndex = 0);
  }

}

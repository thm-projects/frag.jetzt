import { Component, Input, OnInit } from '@angular/core';
import { Motd } from '../../../../../models/motd';

@Component({
  selector: 'app-motd-message',
  templateUrl: './motd-message.component.html',
  styleUrls: ['./motd-message.component.scss']
})
export class MotdMessageComponent implements OnInit {

  @Input()message: Motd;
  translatedMessage: string;
  constructor() { }

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

}

import { Component, OnInit } from '@angular/core';
import { StyleService } from '../../../style/style.service';

@Component({
  selector: 'ars-test-theme',
  templateUrl: './theme-test.component.html',
  styleUrls: ['./theme-test.component.scss']
})
export class ThemeTestComponent implements OnInit {

  constructor(private styleService: StyleService) {
  }

  ngOnInit() {
  }

  setDark() {
    this.styleService.setColor(true);
  }

  setLight() {
    this.styleService.setColor(false);
  }

}

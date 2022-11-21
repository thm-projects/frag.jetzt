import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-create-livepoll',
  templateUrl: './create-livepoll.component.html',
  styleUrls: ['./create-livepoll.component.scss']
})
export class CreateLivepollComponent implements OnInit {

  public onAccept: VoidFunction | undefined;

  constructor(
  ) {
  }

  ngOnInit(): void {
  }

  accept() {
    if (!!this.onAccept) {
      this.onAccept();
    } else {
      throw new Error('accept not set');
    }
  }
}

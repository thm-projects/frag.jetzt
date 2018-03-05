import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  check = 0;

  constructor() {
  }

  ngOnInit() {
  }

  save(email: string, password1: string, password2: string): void {
   // console.log(email, password1, password2);
    if (password1 === password2) {
      console.log(true);
    } else {
      console.log(false);
    }
  }
}

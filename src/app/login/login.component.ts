import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {
  }

  login(username: string, password: string): void {
    username = username.trim();
    password = password.trim();

    if (username === '' || password === '') {
      // ToDo: Handle username and password not correct event
      console.log(`Username or password empty`);
    } else {
      // ToDo: Send data to authentication service
    }
  }

}

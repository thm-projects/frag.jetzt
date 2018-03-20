import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponentPageComponent } from './login-page.component';

describe('LoginComponentPageComponent', () => {
  let component: LoginComponentPageComponent;
  let fixture: ComponentFixture<LoginComponentPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginComponentPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponentPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

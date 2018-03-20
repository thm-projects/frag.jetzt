import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponentPage } from './login-page.component';

describe('LoginComponentPage', () => {
  let component: LoginComponentPage;
  let fixture: ComponentFixture<LoginComponentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginComponentPage ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

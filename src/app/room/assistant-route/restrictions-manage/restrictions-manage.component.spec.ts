import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestrictionsManageComponent } from './restrictions-manage.component';

describe('RestrictionsManageComponent', () => {
  let component: RestrictionsManageComponent;
  let fixture: ComponentFixture<RestrictionsManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestrictionsManageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RestrictionsManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

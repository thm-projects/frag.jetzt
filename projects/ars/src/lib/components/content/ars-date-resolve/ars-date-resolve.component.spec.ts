import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArsDateResolveComponent } from './ars-date-resolve.component';

describe('ArsDateResolveComponent', () => {
  let component: ArsDateResolveComponent;
  let fixture: ComponentFixture<ArsDateResolveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArsDateResolveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArsDateResolveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

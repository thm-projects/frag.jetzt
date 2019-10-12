import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BonusDeleteComponent } from './bonus-delete.component';

describe('BonusDeleteComponent', () => {
  let component: BonusDeleteComponent;
  let fixture: ComponentFixture<BonusDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BonusDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BonusDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

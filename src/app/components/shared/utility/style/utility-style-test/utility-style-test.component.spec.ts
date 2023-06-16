import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilityStyleTestComponent } from './utility-style-test.component';

describe('UtilityStyleTestComponent', () => {
  let component: UtilityStyleTestComponent;
  let fixture: ComponentFixture<UtilityStyleTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UtilityStyleTestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UtilityStyleTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

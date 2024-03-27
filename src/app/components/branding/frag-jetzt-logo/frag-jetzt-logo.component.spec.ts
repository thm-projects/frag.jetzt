import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FragJetztLogoComponent } from './frag-jetzt-logo.component';

describe('FragJetztLogoComponent', () => {
  let component: FragJetztLogoComponent;
  let fixture: ComponentFixture<FragJetztLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FragJetztLogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FragJetztLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

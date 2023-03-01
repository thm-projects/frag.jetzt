import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GptOptinPrivacyComponent } from './gpt-optin-privacy.component';

describe('GptOptinPrivacyComponent', () => {
  let component: GptOptinPrivacyComponent;
  let fixture: ComponentFixture<GptOptinPrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GptOptinPrivacyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GptOptinPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

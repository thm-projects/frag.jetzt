import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollSettingsComponent } from './livepoll-settings.component';

describe('LivepollSettingsComponent', () => {
  let component: LivepollSettingsComponent;
  let fixture: ComponentFixture<LivepollSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

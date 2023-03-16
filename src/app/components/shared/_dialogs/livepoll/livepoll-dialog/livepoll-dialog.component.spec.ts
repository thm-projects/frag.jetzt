import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollDialogComponent } from './livepoll-dialog.component';

describe('LivepollDialogComponent', () => {
  let component: LivepollDialogComponent;
  let fixture: ComponentFixture<LivepollDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

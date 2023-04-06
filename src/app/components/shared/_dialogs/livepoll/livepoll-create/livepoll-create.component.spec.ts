import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivepollCreateComponent } from './livepoll-create.component';

describe('LivepollCreateComponent', () => {
  let component: LivepollCreateComponent;
  let fixture: ComponentFixture<LivepollCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivepollCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LivepollCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

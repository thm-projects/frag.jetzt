import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantRouteComponent } from './assistant-route.component';

describe('AssistantRouteComponent', () => {
  let component: AssistantRouteComponent;
  let fixture: ComponentFixture<AssistantRouteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantRouteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

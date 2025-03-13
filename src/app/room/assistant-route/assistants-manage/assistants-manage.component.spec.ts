import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantsManageComponent } from './assistants-manage.component';

describe('AssistantsManageComponent', () => {
  let component: AssistantsManageComponent;
  let fixture: ComponentFixture<AssistantsManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantsManageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantsManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

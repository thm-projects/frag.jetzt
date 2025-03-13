import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantUploadComponent } from './assistant-upload.component';

describe('AssistantUploadComponent', () => {
  let component: AssistantUploadComponent;
  let fixture: ComponentFixture<AssistantUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

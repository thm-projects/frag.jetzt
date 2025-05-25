import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AdminMailingComponent } from './admin-mailing.component';

describe('AdminMailingComponent', () => {
  let component: AdminMailingComponent;
  let fixture: ComponentFixture<AdminMailingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminMailingComponent],
      imports: [
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(), // New API for HTTP testing
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMailingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test Case 1: Button should be disabled when fields are empty
   */
  it('should disable send button when subject or message is empty', () => {
    // Arrange: Empty fields
    component.subject = '';
    component.message = '';
    fixture.detectChanges();

    // Act: Get the button element
    const sendButton = fixture.debugElement.nativeElement.querySelector(
      'button[mat-flat-button]',
    );

    // Assert: Button should be disabled
    expect(sendButton.disabled).toBeTruthy();
  });

  /**
   * Test Case 2: Button should be enabled when both fields are filled
   */
  it('should enable send button when both subject and message are filled', () => {
    // Arrange: Fill both fields
    component.subject = 'Test Subject';
    component.message = 'Test message content';
    fixture.detectChanges();

    // Act: Get the button element
    const sendButton = fixture.debugElement.nativeElement.querySelector(
      'button[mat-flat-button]',
    );

    // Assert: Button should be enabled
    expect(sendButton.disabled).toBeFalsy();
  });

  /**
   * Test Case 3: Button should be disabled when fields contain only whitespace
   */
  it('should disable send button when fields contain only whitespace', () => {
    // Arrange: Fields with only spaces
    component.subject = '   ';
    component.message = '   ';
    fixture.detectChanges();

    // Act: Get the button element
    const sendButton = fixture.debugElement.nativeElement.querySelector(
      'button[mat-flat-button]',
    );

    // Assert: Button should be disabled (trim() makes empty strings falsy)
    expect(sendButton.disabled).toBeTruthy();
  });

  /**
   * Bonus Test Case: Send method should be called when button is clicked
   */
  it('should call send method when send button is clicked', () => {
    // Arrange: Setup spy and fill fields
    spyOn(component, 'send');
    component.subject = 'Test Subject';
    component.message = 'Test Message';
    fixture.detectChanges();

    // Act: Click the send button
    const sendButton = fixture.debugElement.nativeElement.querySelector(
      'button[mat-flat-button]',
    );
    sendButton.click();

    // Assert: Send method should have been called
    expect(component.send).toHaveBeenCalled();
  });
});

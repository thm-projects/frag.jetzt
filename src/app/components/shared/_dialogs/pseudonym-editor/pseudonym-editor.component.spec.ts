import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms'; // Import
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog'; // Import
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import
import { MatFormFieldModule } from '@angular/material/form-field'; // Import
import { MatInputModule } from '@angular/material/input'; // Import
import { MatButtonModule } from '@angular/material/button'; // Import
import { MatIconModule } from '@angular/material/icon'; // Import
import { MatProgressBarModule } from '@angular/material/progress-bar'; // Import
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // Import (for Material animations)
import { of, throwError } from 'rxjs'; // Import

import { PseudonymEditorComponent } from './pseudonym-editor.component';
import { dataService } from 'app/base/db/data-service'; // Adjust path if necessary

// Mock for MatDialogRef
const mockDialogRef = {
  close: jasmine.createSpy('close'),
};

// Mock for MatSnackBar
const mockSnackBar = {
  open: jasmine.createSpy('open'),
};

// Mock for dataService (simplified)
const mockDataService = {
  localRoomSetting: {
    // Use jasmine.createSpy().and.returnValue() for default behavior
    get: jasmine
      .createSpy('get')
      .and.returnValue(of({ pseudonym: 'InitialName' })),
    createOrUpdate: jasmine
      .createSpy('createOrUpdate')
      .and.returnValue(of({ pseudonym: 'UpdatedName' })), // Return updated data
  },
};

describe('PseudonymEditorComponent', () => {
  let component: PseudonymEditorComponent;
  let fixture: ComponentFixture<PseudonymEditorComponent>;

  beforeEach(async () => {
    // Reset spies before each test
    mockDialogRef.close.calls.reset();
    mockSnackBar.open.calls.reset();
    mockDataService.localRoomSetting.get.calls.reset();
    mockDataService.localRoomSetting.createOrUpdate.calls.reset();

    // Set default return values for spies
    mockDataService.localRoomSetting.get.and.returnValue(
      of({ pseudonym: 'InitialName' }),
    );
    mockDataService.localRoomSetting.createOrUpdate.and.returnValue(
      of({ pseudonym: 'UpdatedName' }),
    );

    await TestBed.configureTestingModule({
      declarations: [PseudonymEditorComponent],
      imports: [
        // Import necessary modules
        ReactiveFormsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule, // Add progress bar module
        NoopAnimationsModule, // Disable animations for testing
      ],
      providers: [
        // Provide mocks
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        // Provide dataService directly using useValue with the mock object
        { provide: dataService, useValue: mockDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PseudonymEditorComponent);
    component = fixture.componentInstance;
    // Set required Inputs for the component
    component.roomId = 'testRoom';
    component.accountId = 'testAccount';
    // fixture.detectChanges() triggers ngOnInit()
    fixture.detectChanges();
    // wait for async operations like data loading in ngOnInit
    await fixture.whenStable();
    fixture.detectChanges(); // Update view after async ops
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with data from service on init', () => {
    // ngOnInit calls loadInitialPseudonym which calls get
    expect(mockDataService.localRoomSetting.get).toHaveBeenCalledWith([
      'testRoom',
      'testAccount',
    ]);
    expect(component.questionerNameFormControl.value).toBe('InitialName');
    expect(component.questionerNameFormControl.pristine).toBeTrue(); // Should be pristine initially
  });

  it('should show error if loading initial data fails', () => {
    // Arrange: Reset component and make get fail
    mockDataService.localRoomSetting.get.and.returnValue(
      throwError(() => new Error('Load Failed')),
    );
    // Re-run initialization logic manually for this specific test case if needed
    // or structure tests differently (e.g., testing the method directly)
    component.ngOnInit(); // Re-trigger ngOnInit
    fixture.detectChanges();

    // Assert
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      component.i18n().loadError || 'Could not load name.',
      'OK',
      jasmine.any(Object),
    );
    expect(component.questionerNameFormControl.value).toBe(''); // Should remain empty on load error
  });

  // --- Validation Tests ---
  it('should mark form as invalid if name is empty', () => {
    component.questionerNameFormControl.setValue('');
    expect(component.questionerNameFormControl.hasError('required')).toBeTrue();
    expect(component.isSaveDisabled).toBeTrue();
  });

  it('should mark form as invalid if name is too short', () => {
    component.questionerNameFormControl.setValue('A');
    expect(
      component.questionerNameFormControl.hasError('minlength'),
    ).toBeTrue();
    expect(component.isSaveDisabled).toBeTrue();
  });

  it('should mark form as invalid if name contains only whitespace', () => {
    component.questionerNameFormControl.setValue('   ');
    // updateValueAndValidity might be needed depending on updateOn setting
    component.questionerNameFormControl.updateValueAndValidity();
    expect(component.questionerNameFormControl.hasError('pattern')).toBeTrue(); // pattern(/\S/) should fail
    expect(component.isSaveDisabled).toBeTrue();
  });

  it('should mark form as invalid if name has leading whitespace', () => {
    component.questionerNameFormControl.setValue(' InvalidName');
    component.questionerNameFormControl.updateValueAndValidity();
    expect(
      component.questionerNameFormControl.hasError('leadingWhitespace'),
    ).toBeTrue();
    expect(component.isSaveDisabled).toBeTrue();
  });

  it('should mark form as valid if name meets criteria', () => {
    component.questionerNameFormControl.setValue('Valid Name');
    component.questionerNameFormControl.markAsDirty(); // Mark as dirty for save button enable check
    expect(component.questionerNameFormControl.valid).toBeTrue();
    expect(component.isSaveDisabled).toBeFalse(); // Assuming not loading
  });

  // --- Action Tests ---
  it('should call createOrUpdate on accept() with valid and dirty form', fakeAsync(() => {
    // Arrange
    component.questionerNameFormControl.setValue('New Valid Name');
    component.questionerNameFormControl.markAsDirty();
    fixture.detectChanges(); // Update view/button states

    // Act
    component.accept();
    tick(); // Process async operations (observables)

    // Assert
    expect(mockDataService.localRoomSetting.createOrUpdate).toHaveBeenCalled();
    const updatedData =
      mockDataService.localRoomSetting.createOrUpdate.calls.mostRecent()
        .args[0];
    expect(updatedData.pseudonym).toBe('New Valid Name'); // Should be trimmed
    expect(mockDialogRef.close).toHaveBeenCalledWith(true); // Dialog should close on success
  }));

  it('should NOT call createOrUpdate on accept() if form is invalid', () => {
    // Arrange
    component.questionerNameFormControl.setValue(''); // Invalid state
    component.questionerNameFormControl.markAsDirty();
    fixture.detectChanges();

    // Act
    component.accept();

    // Assert
    expect(
      mockDataService.localRoomSetting.createOrUpdate,
    ).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should show error and NOT close dialog if accept() fails during save', fakeAsync(() => {
    // Arrange
    component.questionerNameFormControl.setValue('Good Name');
    component.questionerNameFormControl.markAsDirty();
    fixture.detectChanges();
    mockDataService.localRoomSetting.get.and.returnValue(
      of({ pseudonym: 'InitialName' }),
    ); // Get succeeds
    mockDataService.localRoomSetting.createOrUpdate.and.returnValue(
      throwError(() => new Error('Save Failed')),
    ); // Update fails

    // Act
    component.accept();
    tick();

    // Assert
    expect(mockDataService.localRoomSetting.createOrUpdate).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      component.i18n().saveError || 'Could not save name.',
      'OK',
      jasmine.any(Object),
    );
    expect(mockDialogRef.close).not.toHaveBeenCalled(); // Dialog should NOT close
  }));

  it('should call createOrUpdate with empty pseudonym on deletePseudonym()', fakeAsync(() => {
    // Arrange
    component.questionerNameFormControl.setValue('NameToDelete'); // Input must have value to enable delete
    fixture.detectChanges();
    // Mocks for operations inside deletePseudonym
    mockDataService.localRoomSetting.get.and.returnValue(
      of({ pseudonym: 'NameToDelete' }),
    );
    mockDataService.localRoomSetting.createOrUpdate.and.returnValue(
      of({ pseudonym: '' }),
    ); // Simulate successful update

    // Act
    component.deletePseudonym();
    tick(); // Process async operations

    // Assert
    expect(mockDataService.localRoomSetting.createOrUpdate).toHaveBeenCalled();
    const deletedData =
      mockDataService.localRoomSetting.createOrUpdate.calls.mostRecent()
        .args[0];
    expect(deletedData.pseudonym).toBe(''); // Pseudonym should be empty
    expect(mockDialogRef.close).toHaveBeenCalledWith(true); // Dialog should close on success
    expect(component.questionerNameFormControl.value).toBe(''); // Form should be cleared
  }));

  it('should show error and NOT close dialog if deletePseudonym() fails', fakeAsync(() => {
    // Arrange
    component.questionerNameFormControl.setValue('FailedDelete');
    fixture.detectChanges();
    mockDataService.localRoomSetting.get.and.returnValue(
      of({ pseudonym: 'FailedDelete' }),
    ); // Get succeeds
    mockDataService.localRoomSetting.createOrUpdate.and.returnValue(
      throwError(() => new Error('Delete Failed')),
    ); // Update fails

    // Act
    component.deletePseudonym();
    tick();

    // Assert
    expect(mockDataService.localRoomSetting.createOrUpdate).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      component.i18n().deleteError || 'Could not delete name.',
      'OK',
      jasmine.any(Object),
    );
    expect(mockDialogRef.close).not.toHaveBeenCalled(); // Dialog should NOT close
  }));

  it('should clear the input field on clearInput()', () => {
    // Arrange
    component.questionerNameFormControl.setValue('SomeText');

    // Act
    component.clearInput();

    // Assert
    expect(component.questionerNameFormControl.value).toBe('');
    expect(component.questionerNameFormControl.dirty).toBeTrue();
  });

  // --- UI Interaction / Helper Tests ---
  it('should calculate trimmedNameLength correctly', () => {
    component.questionerNameFormControl.setValue('  Test ');
    // Note: auto-trim might affect valueChanges, test the getter directly
    expect(component.trimmedNameLength).toBe(4); // 'Test'
    component.questionerNameFormControl.setValue('');
    expect(component.trimmedNameLength).toBe(0);
    component.questionerNameFormControl.setValue('Leading Space');
    expect(component.trimmedNameLength).toBe(13);
  });

  // Add more tests for edge cases, UI interactions, etc.
});

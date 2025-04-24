import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { PseudonymEditorComponent } from './pseudonym-editor.component';
import { dataService } from 'app/base/db/data-service';

// Local interface definition to avoid import issues
interface LocalRoomSetting {
  accountId: string;
  roomId: string;
  pseudonym: string;
}

// Mock dependencies
const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
const mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
const mockLocalRoomSetting = jasmine.createSpyObj('localRoomSetting', [
  'get',
  'createOrUpdate',
]);

describe('PseudonymEditorComponent', () => {
  let component: PseudonymEditorComponent;
  let fixture: ComponentFixture<PseudonymEditorComponent>;

  beforeEach(async () => {
    // Reset spies
    mockDialogRef.close.calls.reset();
    mockSnackBar.open.calls.reset();
    mockLocalRoomSetting.get.calls.reset();
    mockLocalRoomSetting.createOrUpdate.calls.reset();

    // Configure mock return values
    const mockInitialData: LocalRoomSetting = {
      accountId: 'testAccount',
      roomId: 'testRoom',
      pseudonym: 'InitialName',
    };
    mockLocalRoomSetting.get.and.returnValue(of(mockInitialData));
    mockLocalRoomSetting.createOrUpdate.and.returnValue(
      of(['testRoom', 'testAccount']),
    );

    // Override property with mock implementation
    Object.defineProperty(dataService, 'localRoomSetting', {
      get: () => mockLocalRoomSetting,
    });

    await TestBed.configureTestingModule({
      declarations: [PseudonymEditorComponent],
      imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PseudonymEditorComponent);
    component = fixture.componentInstance;

    // Set required inputs
    component.roomId = 'testRoom';
    component.accountId = 'testAccount';

    fixture.detectChanges();
    await fixture.whenStable();
  });

  // Test 1: Component creation and initialization
  it('should create and initialize properly', () => {
    // 1. Component should be created
    expect(component).toBeTruthy();

    // 2. Component should load initial data
    component.ngOnInit();
    expect(mockLocalRoomSetting.get).toHaveBeenCalledWith([
      'testRoom',
      'testAccount',
    ]);
  });

  // Test 2: Form validation rules
  it('should validate input according to business rules', () => {
    // Test empty input
    component.questionerNameFormControl.setValue('');
    expect(component.questionerNameFormControl.hasError('required')).toBeTrue();
    expect(component.isSaveDisabled).toBeTrue();

    // Test input that's too short
    component.questionerNameFormControl.setValue('A');
    expect(
      component.questionerNameFormControl.hasError('minlength'),
    ).toBeTrue();
    expect(component.isSaveDisabled).toBeTrue();

    // Test input that's too long
    const longName = 'A'.repeat(component.questionerNameMax + 1);
    component.questionerNameFormControl.setValue(longName);
    expect(
      component.questionerNameFormControl.hasError('maxlength'),
    ).toBeTrue();
    expect(component.isSaveDisabled).toBeTrue();

    // Test whitespace handling
    component.questionerNameFormControl.setValue('   ');
    fixture.detectChanges();
    expect(component.isSaveDisabled).toBeTrue();

    // Test leading whitespace trimming
    component.questionerNameFormControl.setValue('  Trimmed Name');
    fixture.detectChanges();
    expect(component.questionerNameFormControl.value).toBe('Trimmed Name');

    // Test valid input
    component.questionerNameFormControl.setValue('Valid Name');
    component.questionerNameFormControl.markAsDirty();
    expect(component.questionerNameFormControl.valid).toBeTrue();
    expect(component.isSaveDisabled).toBeFalse();
  });

  // Test 3: Save operation
  it('should handle save operations correctly', fakeAsync(() => {
    // Setup valid form state
    component.questionerNameFormControl.setValue('New Valid Name');
    component.questionerNameFormControl.markAsDirty();

    // Execute save operation
    component.accept();
    tick();

    // Verify service was called correctly
    const expectedData: LocalRoomSetting = {
      accountId: 'testAccount',
      roomId: 'testRoom',
      pseudonym: 'New Valid Name',
    };

    expect(mockLocalRoomSetting.createOrUpdate).toHaveBeenCalledWith(
      jasmine.objectContaining(expectedData),
    );

    // Verify dialog was closed on success
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);

    // Verify invalid form prevents save
    component.questionerNameFormControl.setValue('');
    component.questionerNameFormControl.markAsDirty();
    mockLocalRoomSetting.createOrUpdate.calls.reset();
    mockDialogRef.close.calls.reset();

    component.accept();

    expect(mockLocalRoomSetting.createOrUpdate).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  }));

  // Test 4: Delete operation
  it('should handle delete operations correctly', fakeAsync(() => {
    component.questionerNameFormControl.setValue('NameToDelete');

    component.deletePseudonym();
    tick();

    const expectedData: LocalRoomSetting = {
      accountId: 'testAccount',
      roomId: 'testRoom',
      pseudonym: '',
    };

    expect(mockLocalRoomSetting.createOrUpdate).toHaveBeenCalledWith(
      jasmine.objectContaining(expectedData),
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    expect(component.questionerNameFormControl.value).toBe('');
  }));

  // Test 5: Error handling
  it('should handle errors gracefully', fakeAsync(() => {
    // Test loading error
    mockLocalRoomSetting.get.and.returnValue(
      throwError(() => new Error('Load Failed')),
    );

    component.ngOnInit();
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      component.i18n().loadError || 'Could not load name.',
      'OK',
      jasmine.any(Object),
    );

    // Test save error
    mockSnackBar.open.calls.reset();
    mockLocalRoomSetting.createOrUpdate.and.returnValue(
      throwError(() => new Error('Save Failed')),
    );

    component.questionerNameFormControl.setValue('Good Name');
    component.questionerNameFormControl.markAsDirty();

    component.accept();
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      component.i18n().saveError || 'Could not save name.',
      'OK',
      jasmine.any(Object),
    );
    expect(mockDialogRef.close).not.toHaveBeenCalled();

    // Test delete error
    mockSnackBar.open.calls.reset();
    mockLocalRoomSetting.createOrUpdate.and.returnValue(
      throwError(() => new Error('Delete Failed')),
    );

    component.deletePseudonym();
    tick();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      component.i18n().deleteError || 'Could not delete name.',
      'OK',
      jasmine.any(Object),
    );
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  }));

  // Test 6: UI state management
  it('should manage UI states properly', () => {
    // Test disabling controls during loading
    component.questionerNameFormControl.setValue('ValidName');
    component.questionerNameFormControl.markAsDirty();
    component.isLoading = true;

    expect(component.isSaveDisabled).toBeTrue();
    expect(component.isDeleteDisabled).toBeTrue();

    // Test disabling delete button with empty input
    component.isLoading = false;
    component.questionerNameFormControl.setValue('');

    expect(component.isDeleteDisabled).toBeTrue();

    // Test clearInput function
    component.questionerNameFormControl.setValue('SomeText');
    component.clearInput();

    expect(component.questionerNameFormControl.value).toBe('');
    expect(component.questionerNameFormControl.dirty).toBeTrue();
  });
});

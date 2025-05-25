import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogRef,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { EditCommentTagComponent } from './edit-comment-tag.component';
import { SessionService } from '../../../../services/util/session.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { RoomService } from '../../../../services/http/room.service';
import { RoomStateService } from 'app/services/state/room-state.service';

/**
 * Unit tests for EditCommentTagComponent
 * Tests core tag selection and dialog functionality
 */
describe('EditCommentTagComponent', () => {
  let component: EditCommentTagComponent;
  let fixture: ComponentFixture<EditCommentTagComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditCommentTagComponent>>;

  beforeEach(async () => {
    // Create spy objects
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    const mockRoomState = jasmine.createSpyObj('RoomStateService', [], {
      assignedRole$: of(1),
    });

    await TestBed.configureTestingModule({
      declarations: [EditCommentTagComponent],
      imports: [
        TranslateModule.forRoot(),
        MatDialogModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatButtonModule,
        FormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: SessionService,
          useValue: { currentRoom: { tags: ['Tag1', 'Tag2'] } },
        },
        { provide: MatDialog, useValue: mockDialog },
        { provide: NotificationService, useValue: {} },
        { provide: RoomService, useValue: {} },
        { provide: RoomStateService, useValue: mockRoomState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCommentTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should save selected tag when save callback is called', () => {
    // Arrange
    const selectedTag = 'Important';
    component.selectedTag = selectedTag;

    // Act
    const saveCallback = component.buildSaveActionCallback();
    saveCallback();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith(selectedTag);
  });

  it('should save null when reset option is selected', () => {
    // Arrange
    component.selectedTag = null;

    // Act
    const saveCallback = component.buildSaveActionCallback();
    saveCallback();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog without saving when cancel callback is called', () => {
    // Arrange
    component.selectedTag = 'Some Tag';

    // Act
    const cancelCallback = component.buildCloseDialogActionCallback();
    cancelCallback();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });
});

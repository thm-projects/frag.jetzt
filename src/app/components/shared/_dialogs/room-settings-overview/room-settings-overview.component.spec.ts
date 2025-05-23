import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RoomSettingsOverviewComponent } from './room-settings-overview.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoomService } from '../../../../services/http/room.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Room } from '../../../../models/room';

// Mock ProfanityFilter enum
enum ProfanityFilter {
  DEACTIVATED = 'DEACTIVATED',
  ALL = 'ALL',
  LANGUAGE_SPECIFIC = 'LANGUAGE_SPECIFIC',
  PARTIAL_WORDS = 'PARTIAL_WORDS',
}

describe('RoomSettingsOverviewComponent', () => {
  it('should create component with dependencies', () => {
    // Create spy objects
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const roomServiceSpy = jasmine.createSpyObj('RoomService', [
      'updateRoomSettings',
      'getRoomSettings',
    ]);

    // Mock room object
    const mockRoom = {
      id: '12345',
      name: 'Test Room',
      shortId: 'test123',
      ownerId: 'owner123',
      description: 'Test description',
      closed: false,
    } as Room;

    TestBed.configureTestingModule({
      declarations: [RoomSettingsOverviewComponent],
      imports: [
        FormsModule,
        MatSlideToggleModule,
        MatTooltipModule,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: RoomService, useValue: roomServiceSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    const fixture = TestBed.createComponent(RoomSettingsOverviewComponent);
    const component = fixture.componentInstance;

    // Configure component
    component['room'] = mockRoom;
    component.directSend = false;
    component.conversationEnabled = true;
    component.profanityFilter = ProfanityFilter.ALL;

    expect(component).toBeTruthy();
  });
});

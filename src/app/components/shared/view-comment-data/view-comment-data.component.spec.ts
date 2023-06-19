import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCommentDataComponent } from './view-comment-data.component';
import { LanguageService } from '../../../services/util/language.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { EventService } from '../../../services/util/event.service';
import { MatDialogModule } from '@angular/material/dialog';
import { ArsModule } from '../../../../../projects/ars/src/lib/ars.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateServiceMock } from '../../../services/mocks/translate.service.mock';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { DB_CONFIG } from '../../../../indexeddb';

describe('ViewCommentDataComponent', () => {
  let component: ViewCommentDataComponent;
  let fixture: ComponentFixture<ViewCommentDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        ArsModule,
        MatTooltipModule,
        NgxIndexedDBModule.forRoot(DB_CONFIG),
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: TranslateServiceMock,
        },
        LanguageService,
        DeviceInfoService,
        EventService,
      ],
      declarations: [ViewCommentDataComponent, TranslatePipe],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewCommentDataComponent);
    component = fixture.componentInstance;
  });

  it('should create with quill editor', async () => {
    expect(component).toBeTruthy();
    component.isEditor = true;
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    component.ngAfterViewInit();
    expect(component.editor).toBeTruthy();
  });
});

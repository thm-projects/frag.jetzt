import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCommentDataComponent } from './view-comment-data.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../services/util/event.service';
import { MatDialogModule } from '@angular/material/dialog';
import { QuillModule } from 'ngx-quill';
import { ArsModule } from '../../../../../projects/ars/src/lib/ars.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import * as QuillNamespace from 'quill';

const Quill: any = QuillNamespace;
import ImageResize from 'quill-image-resize-module';
import 'quill-emoji/dist/quill-emoji.js';
import { TranslateServiceMock } from '../../../services/mocks/translate.service.mock';

Quill.register('modules/imageResize', ImageResize);

export const HttpLoaderFactory = (http: HttpClient) => {
  new TranslateHttpLoader(http, '../../assets/i18n/participant/', '.json');
};

describe('ViewCommentDataComponent', () => {
  let component: ViewCommentDataComponent;
  let fixture: ComponentFixture<ViewCommentDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, QuillModule, ArsModule, MatTooltipModule],
      providers: [
        {
          provide: TranslateService,
          useClass: TranslateServiceMock,
        },
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

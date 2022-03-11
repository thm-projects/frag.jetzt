import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteCommentComponent } from './write-comment.component';
import { ArsModule } from '../../../../../projects/ars/src/lib/ars.module';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TranslateServiceMock } from '../../../services/mocks/translate.service.mock';
import { DeepLService } from '../../../services/http/deep-l.service';
import { LanguagetoolService } from '../../../services/http/languagetool.service';
import { LanguageService } from '../../../services/util/language.service';
import { NotificationService } from '../../../services/util/notification.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('WriteCommentComponent', () => {
  let component: WriteCommentComponent;
  let fixture: ComponentFixture<WriteCommentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ArsModule,
        MatDialogModule,
        MatSnackBarModule,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: TranslateServiceMock,
        },
        DeepLService,
        LanguagetoolService,
        LanguageService,
        NotificationService,
      ],
      declarations: [WriteCommentComponent, TranslatePipe]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WriteCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be allowed to have a questioner name between 2-30 characters', () => {
    component.questionerNameFormControl.setValue('Ab');
    component.questionerNameFormControl.updateValueAndValidity();
    expect(component.questionerNameFormControl.valid).toBeTruthy();

    component.questionerNameFormControl.setValue('5Zexkv95t4v5SKLdZkpS0AMjP6gl1H');
    component.questionerNameFormControl.updateValueAndValidity();
    expect(component.questionerNameFormControl.valid).toBeTruthy();
  });

  it('should not be allowed to have a questioner name less than 2 or above 30 characters', () => {
    component.questionerNameFormControl.setValue('A');
    component.questionerNameFormControl.updateValueAndValidity();
    expect(component.questionerNameFormControl.valid).toBeFalsy();

    component.questionerNameFormControl.setValue('5Zexkv95t4v5SKLdZkpS0AMjP6gl1Ha');
    component.questionerNameFormControl.updateValueAndValidity();
    expect(component.questionerNameFormControl.valid).toBeFalsy();
  });

  it('should be allowed to leave the questioner name empty', () => {
    expect(component.questionerNameFormControl.valid).toBeTruthy();
  });
});

import { NgModule } from '@angular/core';
import { ArsComponent } from './ars.component';
import { FullScreenOverlayComponent } from './components/layout/base/screen/screen.component';
import { RowComponent } from './components/layout/frame/row/row.component';
import { ColComponent } from './components/layout/frame/col/col.component';
import { FillComponent } from './components/layout/frame/fill/fill.component';
import { WrapperDirective } from './components/layout/frame/wrp/WrapperDirective';
import { FrameTestComponent } from './components/test/layout/frame/frame-test/frame-test.component';
import { ScrollDirective } from './components/layout/base/scroll/ScrollDirective';
import { MaterialTypographyComponent } from './components/style/typography/material-typography/material-typography.component';
import { BaseTestComponent } from './components/test/layout/base-test/base-test.component';
import { FlexAlignComponent } from './components/layout/base/flex-align/flex-align.component';
import { MenuWrapperDirective } from './components/content/menu/MenuWrapper.directive';
import { ButtonWrapperDirective } from './components/content/menu/ButtonWrapper.directive';
import { ButtonBaseDirective } from './components/content/menu/ButtonBase.directive';
import { MaterialBtnComponent } from './components/style/menu/material-btn/material-btn.component';
import { MatIconModule } from '@angular/material/icon';
import { ArsComposeHostDirective } from './compose/ars-compose-host.directive';
import { MatButtonComponent } from './compose/elements/mat-button/mat-button.component';
import { MatToggleComponent } from './compose/elements/mat-toggle/mat-toggle.component';
import { MatChipListComponent } from './compose/elements/mat-chip-list/mat-chip-list.component';
import { MatDatePickerComponent } from './compose/elements/mat-date-picker/mat-date-picker.component';
import { MatMenuItemComponent } from './compose/elements/mat-menu-item/mat-menu-item.component';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { ArsMatPaginatorComponent } from './components/content/paginator/ars-mat-paginator/ars-mat-paginator.component';
import { DateFormatterComponent } from './components/content/date-formatter/date-formatter.component';
import { ArsLifeCycleVisitor } from './models/util/ars-life-cycle-visitor';
import { MatSubMenuComponent } from './compose/elements/mat-sub-menu/mat-sub-menu.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';

@NgModule({
  declarations: [
    ArsComponent,
    FullScreenOverlayComponent,
    RowComponent,
    ColComponent,
    FillComponent,
    WrapperDirective,
    FrameTestComponent,
    ScrollDirective,
    MaterialTypographyComponent,
    BaseTestComponent,
    FlexAlignComponent,
    MenuWrapperDirective,
    ButtonWrapperDirective,
    ButtonBaseDirective,
    MaterialBtnComponent,
    ArsComposeHostDirective,
    MatButtonComponent,
    MatToggleComponent,
    MatChipListComponent,
    MatDatePickerComponent,
    MatMenuItemComponent,
    ArsMatPaginatorComponent,
    DateFormatterComponent,
    ArsLifeCycleVisitor,
    MatSubMenuComponent,
  ],
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    TranslateModule,
    MatMenuModule,
    MatInputModule,
    MatSlideToggleModule,
    MatPaginatorModule,
  ],
  exports: [
    ArsComponent,
    FullScreenOverlayComponent,
    WrapperDirective,
    FrameTestComponent,
    ScrollDirective,
    MaterialTypographyComponent,
    RowComponent,
    ColComponent,
    FillComponent,
    BaseTestComponent,
    MenuWrapperDirective,
    ButtonWrapperDirective,
    ButtonBaseDirective,
    MaterialBtnComponent,
    ArsComposeHostDirective,
    ArsMatPaginatorComponent,
    MatButtonComponent,
    DateFormatterComponent,
  ],
})
export class ArsModule {}

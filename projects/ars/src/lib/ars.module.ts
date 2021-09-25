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
import { ThemeTestComponent } from './components/test/theme-test/theme-test.component';
import { BaseTestComponent } from './components/test/layout/base-test/base-test.component';
import { FlexAlignComponent } from './components/layout/base/flex-align/flex-align.component';
import { MenuWrapperDirective } from './components/content/menu/MenuWrapper.directive';
import { ButtonWrapperDirective } from './components/content/menu/ButtonWrapper.directive';
import { ButtonBaseDirective } from './components/content/menu/ButtonBase.directive';
import { MaterialBtnComponent } from './components/style/menu/material-btn/material-btn.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ComposeHostDirective } from './compose/compose-host.directive';
import { MatMenuItemComponent } from './compose/elements/mat-menu-item/mat-menu-item.component';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatToggleComponent } from './compose/elements/mat-toggle/mat-toggle.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LayerPaneComponent } from './components/layout/misc/layer-pane/layer-pane.component';
import { MatChipListComponent } from './compose/elements/mat-chip-list/mat-chip-list.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatePickerComponent } from './compose/elements/mat-date-picker/mat-date-picker.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonComponent } from './compose/elements/mat-button/mat-button.component';

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
    ThemeTestComponent,
    BaseTestComponent,
    FlexAlignComponent,
    MenuWrapperDirective,
    ButtonWrapperDirective,
    ButtonBaseDirective,
    MaterialBtnComponent,
    ComposeHostDirective,
    MatMenuItemComponent,
    MatToggleComponent,
    LayerPaneComponent,
    MatChipListComponent,
    MatDatePickerComponent,
    MatButtonComponent
  ],
  imports:[
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSliderModule,
    TranslateModule,
    RouterModule,
    CommonModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule
  ],
  exports:[
    ArsComponent,
    FullScreenOverlayComponent,
    WrapperDirective,
    FrameTestComponent,
    ScrollDirective,
    MaterialTypographyComponent,
    RowComponent,
    ColComponent,
    FillComponent,
    ThemeTestComponent,
    BaseTestComponent,
    MenuWrapperDirective,
    ButtonWrapperDirective,
    ButtonBaseDirective,
    MaterialBtnComponent,
    ComposeHostDirective,
    MatButtonToggleModule,
    LayerPaneComponent
  ]
})
export class ArsModule { }

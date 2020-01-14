import { NgModule } from '@angular/core';
import { ArsComponent } from './ars.component';
import { MatButtonModule, MatIconModule } from '@angular/material';
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
    MaterialBtnComponent
  ],
  imports: [
    MatIconModule,
    MatButtonModule
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
    ThemeTestComponent,
    BaseTestComponent,
    MenuWrapperDirective
  ]
})
export class ArsModule { }

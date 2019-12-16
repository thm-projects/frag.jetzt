import { NgModule } from '@angular/core';
import { ArsComponent } from './ars.component';
import { ArsSliderDirective } from './components/io/slider/ars-slider.directive';
import { ArsSliderCombComponent } from './components/io/slider/ars-slider-comb/ars-slider-comb.component';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { FullScreenOverlayComponent } from './components/layout/base/full-screen-overlay/full-screen-overlay.component';
import { RowComponent } from './components/layout/frame/row/row.component';
import { ColComponent } from './components/layout/frame/col/col.component';
import { FillComponent } from './components/layout/frame/fill/fill.component';
import { WrapperDirective } from './components/layout/frame/wrp/WrapperDirective';
import { RespComponent } from './components/layout/base/resp/resp.component';
import { ScrollDirective } from './components/layout/base/scroll/ScrollDirective';
import { MaterialTypographyComponent } from './components/style/typography/material-typography/material-typography.component';
import { DialogOverlayComponent } from './components/content/dialog/dialog-overlay/dialog-overlay.component';
import { A11yModule } from '@angular/cdk/a11y';
import { DialogBoxComponent } from './components/content/dialog/dialog-box/dialog-box.component';
import { DialogBoxContentComponent } from './components/content/dialog/dialog-box-content/dialog-box-content.component';
import { MaterialDialogComponent } from './components/style/dialog/material-dialog/material-dialog.component';
import { CommonModule } from '@angular/common';
import { DialogFullscreenComponent } from './components/content/dialog/dialog-fullscreen/dialog-fullscreen.component';

@NgModule({
  declarations: [
    ArsComponent,
    ArsSliderDirective,
    ArsSliderCombComponent,
    FullScreenOverlayComponent,
    RowComponent,
    ColComponent,
    FillComponent,
    WrapperDirective,
    RespComponent,
    ScrollDirective,
    MaterialTypographyComponent,
    DialogOverlayComponent,
    DialogBoxComponent,
    DialogBoxContentComponent,
    MaterialDialogComponent,
    DialogFullscreenComponent
  ],
  imports: [
    MatIconModule,
    MatButtonModule,
    A11yModule,
    CommonModule
  ],
  exports: [
    ArsComponent,
    ArsSliderDirective,
    ArsSliderCombComponent,
    FullScreenOverlayComponent,
    WrapperDirective,
    ScrollDirective,
    MaterialTypographyComponent,
    RowComponent,
    RespComponent,
    ColComponent,
    FillComponent
  ],
  entryComponents: [
    DialogOverlayComponent,
    DialogBoxComponent,
    DialogBoxContentComponent,
    DialogFullscreenComponent
  ]
})
export class ArsModule { }

import { NgModule } from '@angular/core';
import { ArsComponent } from './ars.component';
import { ArsSliderDirective } from './components/io/slider/ars-slider.directive';
import { ArsSliderCombComponent } from './components/io/slider/ars-slider-comb/ars-slider-comb.component';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { FullScreenOverlayComponent } from './components/layout/base/full-screen-overlay/full-screen-overlay.component';

@NgModule({
  declarations: [
    ArsComponent,
    ArsSliderDirective,
    ArsSliderCombComponent,
    FullScreenOverlayComponent
  ],
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    ArsComponent,
    ArsSliderDirective,
    ArsSliderCombComponent,
    FullScreenOverlayComponent
  ]
})
export class ArsModule { }

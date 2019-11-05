import { NgModule } from '@angular/core';
import { ArsComponent } from './ars.component';
import { ArsSliderDirective } from './components/io/slider/ars-slider.directive';
import { ArsSliderCombComponent } from './components/io/slider/ars-slider-comb/ars-slider-comb.component';
import { MatButtonModule, MatIconModule } from '@angular/material';

@NgModule({
  declarations: [
    ArsComponent,
    ArsSliderDirective,
    ArsSliderCombComponent
  ],
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    ArsComponent,
    ArsSliderDirective,
    ArsSliderCombComponent
  ]
})
export class ArsModule { }

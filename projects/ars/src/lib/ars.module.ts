import { NgModule } from '@angular/core';
import { ArsComponent } from './ars.component';
import { ArsSlider } from './components/io/slider/ArsSlider';
import { ArsSliderCombComponent } from './components/io/slider/ars-slider-comb/ars-slider-comb.component';
import { MatButtonModule, MatIconModule } from '@angular/material';

@NgModule({
  declarations: [
    ArsComponent,
    ArsSlider,
    ArsSliderCombComponent
  ],
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    ArsComponent,
    ArsSlider,
    ArsSliderCombComponent
  ]
})
export class ArsModule { }

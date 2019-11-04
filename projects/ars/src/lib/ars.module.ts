import { NgModule } from '@angular/core';
import { ArsComponent } from './ars.component';
import { ArsSlider } from './components/io/slider/ArsSlider';

@NgModule({
  declarations: [
    ArsComponent,
    ArsSlider
  ],
  imports: [
  ],
  exports: [
    ArsComponent,
    ArsSlider
  ]
})
export class ArsModule { }

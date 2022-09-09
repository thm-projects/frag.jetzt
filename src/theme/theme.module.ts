import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeDirective } from './theme.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [ThemeDirective],
  exports: [ThemeDirective],
})
export class ThemeModule {
}

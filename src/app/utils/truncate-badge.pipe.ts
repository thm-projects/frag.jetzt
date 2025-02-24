import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'truncateBadge',
})
export class TruncateBadgePipe implements PipeTransform {
  transform(value: number, digits: number = 999): string {
    if (!value) return '';
    if (value > digits) {
      return `${digits}+`;
    }
    return value.toString();
  }
}

import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'truncateBadge',
})
export class TruncateBadgePipe implements PipeTransform {
  transform(value: number): string {
    if (value > 999) {
      return '999+';
    }
    return value.toString();
  }
}

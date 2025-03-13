import { Pipe, PipeTransform } from '@angular/core';
import { i18nContext } from './i18n-context';

@Pipe({
  name: 'context',
  standalone: true,
  pure: true,
})
export class ContextPipe implements PipeTransform {
  transform(value: string, ...args: unknown[]): string {
    return i18nContext(value, (args[0] as Record<string, string>) || {});
  }
}

import { forwardRef } from '@angular/core';

export class Provider {

  public static create(cls: any): Function {
    return (e: any) => {
      return { provide: cls, useExisting: forwardRef(() => e) };
    };
  }

}

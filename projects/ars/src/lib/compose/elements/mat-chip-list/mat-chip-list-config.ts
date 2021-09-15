import { InjectionToken } from '@angular/core';
import { ArsObserver } from '../../../models/util/ArsObserver';

export interface ArsMatChipListConfig {
  list:ArsObserver<string[]>;
  onSelect:(e:string)=>void;
}
export const ARS_MAT_CHIP_LIST_CONFIG=new InjectionToken('ARS_MAT_CHIP_LIST_CONFIG');

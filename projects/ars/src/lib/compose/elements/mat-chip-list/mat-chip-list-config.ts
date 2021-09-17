import { InjectionToken } from '@angular/core';
import { ArsObserver } from '../../../models/util/ArsObserver';

export interface ArsMatChipListConfig {
  list:ArsObserver<string[]>;
  def?:string[];
  onSelect:(e:string[])=>void;
  type?:ArsMatChipListType;
}

export enum ArsMatChipListType {
  SELECT,
  SELECTION,
  TOGGLE
}

export const ARS_MAT_CHIP_LIST_CONFIG=new InjectionToken('ARS_MAT_CHIP_LIST_CONFIG');

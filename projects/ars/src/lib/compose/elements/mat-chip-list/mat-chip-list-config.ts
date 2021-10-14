import { InjectionToken } from '@angular/core';
import { ArsObserver } from '../../../models/util/ars-observer';

export interface ArsMatChipConfig{
  title: string;
  icon?: string;
  isSVGIcon?: boolean;
  color?: string;
  onSelect?: (e: ArsMatChipConfig) => void;
  condition?: () => boolean;
}

export interface ArsMatChipListConfig{
  list: ArsObserver<ArsMatChipConfig[]>;
  def?: string[];
  onSelect?: (e: ArsObserver<ArsMatChipConfig[]>) => void;
  type?: ArsMatChipListType;
}

export enum ArsMatChipListType{
  SELECT,
  SELECTION,
  TOGGLE
}

export const ARS_MAT_CHIP_LIST_CONFIG = new InjectionToken('ARS_MAT_CHIP_LIST_CONFIG');

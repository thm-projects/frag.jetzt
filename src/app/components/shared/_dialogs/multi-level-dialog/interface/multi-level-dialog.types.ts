import { EventEmitter, InjectionToken, Injector, Output } from '@angular/core';

export interface AnsweredMultiLevelDataEntry {
  value: any;
  answers: AnsweredMultiLevelDataEntry[];
}

export interface AnsweredMultiLevelData {
  cachedAnswers: Map<string, any>;
  answers: AnsweredMultiLevelDataEntry[];
}

export interface ActionSelect {
  type: 'select';
  optionLabels: string[];
}

export type MultiLevelAction = ActionSelect;

export interface MultiLevelDataEntry {
  tag: string;
  active?: (answers: AnsweredMultiLevelData) => boolean;
  title: string;
  action: MultiLevelAction;
  questions?: MultiLevelDataEntry[];
}

export interface MultiLevelData {
  title: string;
  buttonSection: string;
  confirmKey: string;
  questions: MultiLevelDataEntry[];
}

export interface AnnotatedMultiLevelDataEntry extends MultiLevelDataEntry {
  display: string;
  index: number[];
  injector: Injector;
}

export interface MultiLevelActionInterface {
  submit: (value: any) => void;
  entry: AnnotatedMultiLevelDataEntry;
}

export const DYNAMIC_INPUT = new InjectionToken<MultiLevelActionInterface>(
  'MulitLevelActionInterface',
);

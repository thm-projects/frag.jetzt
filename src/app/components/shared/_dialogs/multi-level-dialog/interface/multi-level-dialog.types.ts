import { InjectionToken, Injector } from '@angular/core';
import { FormControl } from '@angular/forms';

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

export interface ActionTextInput {
  type: 'text-input';
  label: string;
  placeholder?: string;
  hint?: string;
  control?: FormControl;
  errorMessages?: { [key: string]: string };
}

export type MultiLevelAction = ActionSelect | ActionTextInput;

export interface MultiLevelDataEntry<
  T extends MultiLevelAction = MultiLevelAction,
> {
  tag: string;
  active?: (answers: AnsweredMultiLevelData) => boolean;
  title: string;
  action: T;
  questions?: MultiLevelDataEntry[];
}

export interface MultiLevelData {
  title: string;
  buttonSection: string;
  confirmKey: string;
  questions: MultiLevelDataEntry[];
}

export interface AnnotatedMultiLevelDataEntry<
  T extends MultiLevelAction = MultiLevelAction,
> extends MultiLevelDataEntry<T> {
  display: string;
  index: number[];
  injector: Injector;
}

export interface MultiLevelActionInterface<T extends MultiLevelAction> {
  submit: (value: any) => void;
  entry: AnnotatedMultiLevelDataEntry<T>;
}

export const DYNAMIC_INPUT = new InjectionToken<
  MultiLevelActionInterface<MultiLevelAction>
>('MulitLevelActionInterface');

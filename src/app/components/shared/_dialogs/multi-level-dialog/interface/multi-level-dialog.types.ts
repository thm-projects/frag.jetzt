import { InjectionToken, Injector } from '@angular/core';
import {
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { MultiLevelRadioSelectComponent } from '../multi-level-radio-select/multi-level-radio-select.component';
import { MultiLevelTextInputComponent } from '../multi-level-text-input/multi-level-text-input.component';
import { MultiLevelSwitchComponent } from '../multi-level-switch/multi-level-switch.component';
import { MultiLevelTextComponent } from '../multi-level-text/multi-level-text.component';
import { Observable } from 'rxjs';
import { ClassType } from 'app/utils/ts-utils';

export type AnsweredMultiLevelData = Record<string, FormGroup>;

export interface MultiLevelDataEntry {
  tag: string;
  title: string;
  stepHelp?: string | ClassType<unknown>;
  active?: (
    answers: AnsweredMultiLevelData,
    injector: Injector,
  ) => boolean | Observable<boolean>;
  count?: (
    answers: AnsweredMultiLevelData,
    injector: Injector,
  ) => boolean | Observable<boolean>;
  buildAction: (
    injector: Injector,
    answers: AnsweredMultiLevelData,
    previousState?: MultiLevelDataBuiltAction,
  ) => MultiLevelDataBuiltAction | Observable<MultiLevelDataBuiltAction>;
}

export interface MultiLevelDataBuiltAction extends MultiLevelDataEntry {
  group: FormGroup;
  config: BuiltAction<MultiLevelAction>[];
}

export interface MultiLevelData {
  title: string;
  buttonSection: string;
  confirmKey: string;
  questions: MultiLevelDataEntry[];
}

export interface AnnotatedMultiLevelDataEntry extends MultiLevelDataEntry {
  built: MultiLevelDataBuiltAction;
}

interface BaseAction {
  tag: string;
  label?: string;
  hint?: string;
  errorStates?: {
    [key: string]: string;
  };
  validators?: ValidatorFn[];
  asyncValidators?: AsyncValidatorFn[];
}

export interface RadioSelectAction extends BaseAction {
  type: 'radio-select';
  defaultValue?: unknown;
  options: {
    value: unknown;
    label: string;
  }[];
}

export interface SwitchAction extends BaseAction {
  type: 'switch';
  label: string;
  defaultValue?: boolean;
}

export interface TextInputAction extends BaseAction {
  type: 'text-input';
  defaultValue?: string;
  placeholder?: string;
  hidden?: boolean;
}

export interface TextAction {
  type: 'text';
  value: string;
}

export type MultiLevelAction =
  | TextAction
  | RadioSelectAction
  | SwitchAction
  | TextInputAction;

export type BuiltAction<T> = T & {
  control: FormControl;
  component: ClassType<unknown>;
  injector: Injector;
};

export const DYNAMIC_INPUT = new InjectionToken<BuiltAction<MultiLevelAction>>(
  'MultiLevelAction',
);

const MAPPER: { [key in MultiLevelAction['type']]: ClassType<unknown> } = {
  'radio-select': MultiLevelRadioSelectComponent,
  switch: MultiLevelSwitchComponent,
  'text-input': MultiLevelTextInputComponent,
  text: MultiLevelTextComponent,
};

export const buildInput = (
  self: MultiLevelDataEntry,
  ...args: MultiLevelAction[]
): MultiLevelDataBuiltAction => {
  const obj: { [key: string]: FormControl } = {};
  const config: BuiltAction<MultiLevelAction>[] = args.map((action) => {
    let control: FormControl = null;
    if ('tag' in action) {
      // support multi synced inputs in group
      control =
        obj[action.tag] ??
        new FormControl(
          action.defaultValue,
          action.validators,
          action.asyncValidators,
        );
      obj[action.tag] = control;
    }
    const built: BuiltAction<MultiLevelAction> = {
      ...action,
      control,
      component: MAPPER[action.type],
      injector: null,
    };
    built.injector = Injector.create({
      providers: [
        {
          provide: DYNAMIC_INPUT,
          useValue: built,
        },
      ],
    });
    return built;
  });
  return {
    ...self,
    group: new FormGroup(obj),
    config,
  };
};

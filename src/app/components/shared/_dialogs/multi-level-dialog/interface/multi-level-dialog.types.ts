import { InjectionToken, Injector, Type } from '@angular/core';
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
import { MultiLevelQuotaInputComponent } from '../multi-level-quota-input/multi-level-quota-input.component';
import { MultiLevelDateInputComponent } from '../multi-level-date-input/multi-level-date-input.component';
import { MultiLevelSelectInputComponent } from '../multi-level-select-input/multi-level-select-input.component';
import { QuotaAccessTime } from 'app/services/http/quota.service';
import { GPTModel } from 'app/services/http/gpt.service';

export type AnsweredMultiLevelData = Record<
  string,
  {
    group: FormGroup;
  }
>;

export interface MultiLevelDataEntry<T = unknown> {
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
    previousState?: FormGroup,
    dialogData?: T,
  ) => MultiLevelDataBuiltAction<T> | Observable<MultiLevelDataBuiltAction<T>>;
}

export interface MultiLevelDataBuiltAction<T> extends MultiLevelDataEntry<T> {
  group: FormGroup;
  config: BuiltAction<MultiLevelAction>[];
}

export interface MultiLevelData<T = unknown> {
  title: string;
  questions: MultiLevelDataEntry<T>[];
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
    helpText?: string;
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

export interface SelectInputAction extends BaseAction {
  type: 'select-input';
  defaultValue?: string;
  placeholder?: string;
  hidden?: boolean;
  options: GPTModel[];
}

export interface QuotaInputAction extends BaseAction {
  type: 'quota-input';
  defaultValue?: string;
  placeholder?: string;
  hidden?: boolean;
  allowedRange: {
    min: number;
    max: number;
    step: number;
  };
}

export interface DateInputAction extends BaseAction {
  type: 'date-input';
  defaultValue?: string;
  placeholder?: string;
  hidden?: boolean;
  defaultValues?: QuotaAccessTime[];
  labels: [string, string, string, string, string, string];
}

export interface TextAction {
  type: 'text';
  value: string;
}

export type MultiLevelAction =
  | TextAction
  | RadioSelectAction
  | SwitchAction
  | TextInputAction
  | QuotaInputAction
  | DateInputAction
  | SelectInputAction;

export type BuiltAction<T> = T & {
  control: FormControl;
  component: Type<unknown>;
  injector: Injector;
};

export const DYNAMIC_INPUT = new InjectionToken<BuiltAction<MultiLevelAction>>(
  'MultiLevelAction',
);

const MAPPER: { [key in MultiLevelAction['type']]: Type<unknown> } = {
  'radio-select': MultiLevelRadioSelectComponent,
  switch: MultiLevelSwitchComponent,
  'text-input': MultiLevelTextInputComponent,
  'quota-input': MultiLevelQuotaInputComponent,
  'date-input': MultiLevelDateInputComponent,
  'select-input': MultiLevelSelectInputComponent,
  text: MultiLevelTextComponent,
};

export const buildInput = <T = unknown>(
  self: MultiLevelDataEntry<T>,
  ...args: MultiLevelAction[]
): MultiLevelDataBuiltAction<T> => {
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

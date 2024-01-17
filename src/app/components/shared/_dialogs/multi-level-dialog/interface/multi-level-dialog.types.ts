import { InjectionToken, Injector } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MultiLevelRadioSelectComponent } from '../multi-level-radio-select/multi-level-radio-select.component';
import { MultiLevelTextInputComponent } from '../multi-level-text-input/multi-level-text-input.component';
import { MultiLevelSwitchComponent } from '../multi-level-switch/multi-level-switch.component';
import { MultiLevelTextComponent } from '../multi-level-text/multi-level-text.component';
import { Observable } from 'rxjs';
import { MultiLevelQuotaInputComponent } from '../multi-level-quota-input/multi-level-quota-input.component';
import { MultiLevelDateInputComponent } from '../multi-level-date-input/multi-level-date-input.component';
import { MultiLevelSelectInputComponent } from '../multi-level-select-input/multi-level-select-input.component';
import { Model } from 'app/services/http/gpt.service';

export type AnsweredMultiLevelData = Record<string, FormGroup>;

export interface MultiLevelDataEntry<T = any> {
  tag: string;
  title: string;
  stepHelp?: string | any;
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
    previousState?: MultiLevelDataBuiltAction<T>,
    dialogData?: T,
  ) => MultiLevelDataBuiltAction<T> | Observable<MultiLevelDataBuiltAction<T>>;
}

export interface MultiLevelDataBuiltAction<T> extends MultiLevelDataEntry<T> {
  group: FormGroup;
  config: BuiltAction<MultiLevelAction>[];
}

export interface MultiLevelData<T = any> {
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
  validators?: any[];
  asyncValidators?: any[];
}

export interface RadioSelectAction extends BaseAction {
  type: 'radio-select';
  defaultValue?: any;
  options: {
    value: any;
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

export interface SelectInputAction extends BaseAction {
  type: 'select-input';
  defaultValue?: string;
  placeholder?: string;
  hidden?: boolean;
  options: Model[];
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
  }
}

export interface DateInputAction extends BaseAction {
  type: 'date-input';
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
  | TextInputAction
  | QuotaInputAction
  | DateInputAction
  | SelectInputAction;

export type BuiltAction<T> = T & {
  control: FormControl;
  component: any;
  injector: Injector;
};

export const DYNAMIC_INPUT = new InjectionToken<BuiltAction<MultiLevelAction>>(
  'MultiLevelAction',
);

const MAPPER: { [key in MultiLevelAction['type']]: any } = {
  'radio-select': MultiLevelRadioSelectComponent,
  switch: MultiLevelSwitchComponent,
  'text-input': MultiLevelTextInputComponent,
  'quota-input': MultiLevelQuotaInputComponent,
  'date-input': MultiLevelDateInputComponent,
  'select-input': MultiLevelSelectInputComponent,
  text: MultiLevelTextComponent,
};

export const buildInput = <T = any>(
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

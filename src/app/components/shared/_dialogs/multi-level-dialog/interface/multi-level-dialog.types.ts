import { InjectionToken, Injector } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MultiLevelRadioSelectComponent } from '../multi-level-radio-select/multi-level-radio-select.component';
import { MultiLevelTextInputComponent } from '../multi-level-text-input/multi-level-text-input.component';
import { MultiLevelSwitchComponent } from '../multi-level-switch/multi-level-switch.component';
import { MultiLevelTextComponent } from '../multi-level-text/multi-level-text.component';

export type AnsweredMultiLevelData = Record<string, FormGroup>;

export interface MultiLevelDataEntry {
  tag: string;
  title: string;
  active?: (answers: AnsweredMultiLevelData) => boolean;
  buildAction: (answers: AnsweredMultiLevelData) => MultiLevelDataBuiltAction;
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
  validators?: any[];
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
  defaultValue?: boolean;
}

export interface TextInputAction extends BaseAction {
  type: 'text-input';
  defaultValue?: string;
  placeholder?: string;
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
        new FormControl(action.defaultValue, action.validators);
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

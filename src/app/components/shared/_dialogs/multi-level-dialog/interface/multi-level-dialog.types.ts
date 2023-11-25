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
}

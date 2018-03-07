import { AnswerOption } from './answer-option';

export class ChoiceContent {
  options: AnswerOption[];
  correctOtionIndexes: number[];
  multiple: boolean;
}

import { AnswerOption } from './answerOption';

export class ChoiceContent {
  options: AnswerOption[];
  correctOtionIndexes: number[];
  multiple: boolean;
}

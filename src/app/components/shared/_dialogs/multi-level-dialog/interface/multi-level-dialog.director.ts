import { EventEmitter, Injector } from '@angular/core';
import {
  AnnotatedMultiLevelDataEntry,
  AnsweredMultiLevelData,
  AnsweredMultiLevelDataEntry,
  DYNAMIC_INPUT,
  MultiLevelData,
  MultiLevelDataEntry,
} from './multi-level-dialog.types';

interface StackEntry {
  questions: MultiLevelDataEntry[];
  answers: AnsweredMultiLevelDataEntry[];
  activeCounter: number[];
}

export class MultiLevelDialogDirector {
  newElement = new EventEmitter<number>();
  finished = new EventEmitter<boolean>();
  private activeElements: AnnotatedMultiLevelDataEntry[] = [];
  private stack: StackEntry[] = [];
  private answers: AnsweredMultiLevelData;

  constructor(private data: MultiLevelData) {
    const answers: AnsweredMultiLevelDataEntry[] = [];
    this.answers = { cachedAnswers: new Map(), answers };
    this.stack = [
      { questions: this.data.questions, answers, activeCounter: [] },
    ];
    this.next();
  }

  getAnswers(): AnsweredMultiLevelData {
    return this.answers;
  }

  getActiveElements(): AnnotatedMultiLevelDataEntry[] {
    return this.activeElements;
  }

  answer(value: any, current: AnnotatedMultiLevelDataEntry): boolean {
    const indexes = current.index;
    this.revertTo(indexes);
    const last = indexes.length - 1;
    const top = this.stack[last];
    const question = top.questions[indexes[last]];
    this.answers.cachedAnswers.set(question.tag, value);
    top.answers[indexes[last]].value = value;
    if (this.next()) {
      this.newElement.next(this.activeElements.length - 1);
      return true;
    }
    this.finished.next(true);
    return false;
  }

  private revertTo(index: number[]) {
    index = [...index];
    while (index.length > 0 && index[index.length - 1] < 0) {
      index.pop();
    }
    let currentIndex = this.buildStackIndex();
    let len = Math.min(currentIndex.length, index.length);
    for (let i = 0; i < len; i += 1) {
      let idx = currentIndex[i];
      // When the current index is already smaller than the revert index, abort
      if (idx < index[i]) {
        return;
      }
      // When the current index is larger than the revert index, revert data
      while (idx > index[i]) {
        this.revert(i);
        currentIndex = this.buildStackIndex();
        len = Math.min(currentIndex.length, index.length);
        if (currentIndex.length < i) {
          break;
        }
        idx = currentIndex[i];
      }
      // Advance till the end of the stack
    }
    if (currentIndex.length > index.length) {
      const d = this.revert(index.length - 1, true);
      if (d) {
        console.warn('Could this be an error? - Multi-Level Dialog');
      }
    }
  }

  private buildStackIndex() {
    const index = this.stack.map((e) => e.activeCounter.length - 1);
    while (index.length > 0 && index[index.length - 1] < 0) {
      index.pop();
    }
    return index;
  }

  private revert(stackIndex: number, ignoreSelf = false) {
    if (stackIndex < this.stack.length - 1) {
      while (this.revert(stackIndex + 1)) {
        // Continue
      }
      const prev = this.stack.pop();
      prev.answers.length = 0;
    }
    if (ignoreSelf) {
      return this.reapplyStack(stackIndex);
    }
    const top = this.stack[stackIndex];
    const index = top.activeCounter.pop();
    if (index === undefined) {
      return false;
    }
    const question = top.questions[index];
    this.answers.cachedAnswers.delete(question.tag);
    this.activeElements.pop();
    top.answers.splice(index);
    return this.reapplyStack(stackIndex);
  }

  private reapplyStack(stackIndex: number) {
    const top = this.stack[stackIndex];
    if (top.activeCounter.length === 0) {
      return false;
    }
    const index = top.activeCounter[top.activeCounter.length - 1];
    const question = top.questions[index];
    const answers = top.answers[index].answers;
    this.stack.push({
      questions: question.questions || [],
      answers,
      activeCounter: answers
        .map((e, i) => (e.answers ? i : -1))
        .filter((e) => e >= 0),
    });
    this.reapplyStack(stackIndex + 1);
    return true;
  }

  private next(): boolean {
    while (this.stack.length > 0) {
      if (this.nextQuestionFromStack()) {
        return true;
      }
    }
    return false;
  }

  private nextQuestionFromStack(): boolean {
    if (this.stack.length === 0) {
      return false;
    }
    const top = this.stack[this.stack.length - 1];
    let currentIndex = top.activeCounter[top.activeCounter.length - 1] ?? -1;
    for (
      currentIndex += 1;
      currentIndex < top.questions.length;
      currentIndex += 1
    ) {
      const question = top.questions[currentIndex];
      if (question.active && !question.active(this.answers)) {
        top.answers.push({ value: null, answers: null });
        continue;
      }
      top.activeCounter.push(currentIndex);
      const obj: AnnotatedMultiLevelDataEntry = {
        ...question,
        display: this.stack.reduce((acc, cur) => {
          const id = String(cur.activeCounter.length);
          return (acc ? acc + '.' : '') + id;
        }, ''),
        index: this.stack.map((e) => e.activeCounter.length - 1),
        injector: null,
      };
      this.activeElements.push(obj);
      obj.injector = Injector.create({
        providers: [
          {
            provide: DYNAMIC_INPUT,
            useValue: {
              submit: (value: any) => this.answer(value, obj),
              entry: obj,
            },
          },
        ],
      });
      const answers: AnsweredMultiLevelDataEntry[] = [];
      top.answers.push({ value: null, answers });
      this.stack.push({
        questions: question.questions || [],
        answers,
        activeCounter: [],
      });
      return true;
    }
    this.stack.pop();
    return false;
  }
}

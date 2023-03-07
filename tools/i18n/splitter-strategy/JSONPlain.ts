import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';

const START_SEQ = '{\n"language-data": [\n';
const END_SEQ = '\n]\n}';

export class JSONPlainBuilder {
  private results: string[] = [];
  private current = START_SEQ;
  private first = true;
  private finished = false;

  constructor(private encode: GPTEncoder, private threshold = 800) {}

  addElement(element: any) {
    if (this.finished) {
      throw new Error('Builder already finished');
    }
    const encodedElement = JSON.stringify(element);
    const delim = this.first ? '' : ',\n';
    const newStr = this.current + delim + encodedElement;
    this.first = false;
    if (this.encode.encode(newStr).length <= this.threshold) {
      this.current = newStr;
      return;
    }
    this.results.push(this.current + END_SEQ);
    this.current = START_SEQ + encodedElement;
  }

  build(): string[] {
    if (this.finished) {
      return this.results;
    }
    this.finished = true;
    if (!this.first) {
      this.results.push(this.current + END_SEQ);
    }
    return this.results;
  }
}

export class JSONPlainReconstructor {
  constructor(private readonly translatedKeys: string[]) {}

  reconstructElement() {
    if (this.translatedKeys.length > 0) {
      return this.translatedKeys.shift();
    }
    throw new Error('Some keys are gone through translation.');
  }

  verify() {
    if (this.translatedKeys.length > 0) {
      throw new Error('Not all keys were used, something went wrong.');
    }
  }
}

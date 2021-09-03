import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';

interface ResultValue {
  body: string;
  text: string;
}

interface TextMeta {
  index: number;
  textLines: string[];
  newlineEndings: number;
}

@Component({
  selector: 'app-deep-ldialog',
  templateUrl: './deep-ldialog.component.html',
  styleUrls: ['./deep-ldialog.component.scss']
})
export class DeepLDialogComponent implements OnInit {

  radioButtonValue: ResultValue;
  normalValue: ResultValue;
  improvedValue: ResultValue;

  constructor(
    private dialogRef: MatDialogRef<DeepLDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  private static buildTextArrayFromDelta(delta: any): [number, TextMeta[]] {
    const result: TextMeta[] = [];
    let lastTextIndex = -1;
    let newlinePrefix = 0;
    for (let i = 0; i < delta.ops.length; i++) {
      const data = delta.ops[i]['insert'];
      if (typeof data !== 'string') {
        continue;
      }
      if (data === '') {
        continue;
      }
      const count = data.split('\n').reduce((acc, e) => e.trim() === '' && acc !== -2 ? acc + 1 : -2, -1);
      if (count > 0) {
        if (lastTextIndex >= 0) {
          result[lastTextIndex].newlineEndings += count;
        } else {
          newlinePrefix += count;
        }
        continue;
      }
      lastTextIndex = result.length;
      result.push({ index: i, textLines: data.split(/\n+/), newlineEndings: 0 });
      delta.ops[i]['insert'] = '';
    }
    return [newlinePrefix, result];
  }

  private static applyDeeplTextByTextMeta(improvedText: string, prefixOffset: number, result: TextMeta[], delta: any) {
    const data = improvedText.split('\n');
    let index = prefixOffset;
    let previousResult = '';
    for (const meta of result) {
      if (meta.newlineEndings > 0) {
        delta.ops[meta.index]['insert'] += previousResult + data.slice(index, index + meta.textLines.length).join('\n');
        previousResult = '';
      } else {
        if (meta.textLines.length > 1) {
          delta.ops[meta.index]['insert'] += previousResult + data.slice(index, index + meta.textLines.length - 1).join('\n');
          previousResult = '';
        }
        const str = meta.textLines[meta.textLines.length - 1];
        const dataStr = data[index + meta.textLines.length - 1] || '\n';
        const newStr = previousResult ? previousResult : dataStr;
        if (str.trim() === '') {
          if (newStr.trim() === '') {
            delta.ops[meta.index]['insert'] += newStr;
            previousResult = '';
          } else {
            previousResult = newStr;
          }
        } else {
          if (newStr.trim() === '') {
            delta.ops[meta.index]['insert'] += newStr;
            previousResult = '';
          } else {
            const [current, next] = this.getOverlappingSentences(str, newStr);
            delta.ops[meta.index]['insert'] += current;
            previousResult = next;
            if (next.trim() === '') {
              index++;
              previousResult = '\n';
            }
          }
        }
      }
      index += meta.textLines.length + meta.newlineEndings - 1;
    }
    if (previousResult.trim()) {
      delta.ops[result[result.length - 1].index]['insert'] += previousResult;
    }
  }

  private static countSentencesInText(text: string): number[] {
    const regex = /((?<=[^\t !.?]{2})\.( ?\.)*)|([!?]( ?[!?])*)/g;
    let m;
    const result = [];
    while ((m = regex.exec(text)) !== null) {
      result.push(m.index + m[0].length);
    }
    return result;
  }

  private static getWordCount(text: string): number[] {
    const regex = /[ \t!.?]+/g;
    let m;
    const result = [];
    while ((m = regex.exec(text)) !== null) {
      result.push(m.index + m[0].length);
    }
    if (result.length) {
      const ind = result[result.length - 1];
      if (text.substring(ind).trim().length > 0) {
        result.push(text.length);
      }
    } else if (text.trim().length) {
      result.push(text.length);
    }
    return result;
  }

  private static getOverlappingSentences(str: string, newStr: string): [current: string, next: string] {
    const sentIndexes = this.countSentencesInText(str);
    const sentUpdateIndexes = this.countSentencesInText(newStr);
    if (sentIndexes.length && sentIndexes[sentIndexes.length - 1] === str.length) {
      const index = sentUpdateIndexes[sentIndexes.length - 1];
      return [newStr.substring(0, index), newStr.substring(index)];
    }
    let lastIndex = 0;
    if (sentIndexes.length) {
      lastIndex = sentIndexes[sentIndexes.length - 1];
    }
    let updateWords;
    const offset = sentIndexes.length > 0 ? sentUpdateIndexes[sentIndexes.length - 1] : 0;
    if (sentIndexes.length < sentUpdateIndexes.length) {
      const text = newStr.substring(offset, sentUpdateIndexes[sentIndexes.length]);
      updateWords = this.getWordCount(text);
    } else {
      const text = newStr.substr(offset);
      updateWords = this.getWordCount(text);
    }
    const words = this.getWordCount(str.substr(lastIndex));
    if (words.length === 0) {
      return [newStr.substring(0, offset), newStr.substr(offset)];
    }
    const startIndex = updateWords.length > words.length ? offset + updateWords[words.length] : newStr.length;
    return [newStr.substring(0, startIndex), newStr.substr(startIndex)];
  }

  ngOnInit(): void {
    this.normalValue = {
      body: this.data.body,
      text: this.data.text
    };
    const delta = ViewCommentDataComponent.getDeltaFromData(this.data.body);
    if (delta === null) {
      setTimeout(() => this.dialogRef.close(this.normalValue));
      return;
    }
    const [offset, meta] = DeepLDialogComponent.buildTextArrayFromDelta(delta);
    DeepLDialogComponent.applyDeeplTextByTextMeta(this.data.improvedText, offset, meta, delta);
    this.improvedValue = {
      body: ViewCommentDataComponent.getDataFromDelta(delta),
      text: this.data.improvedText
    };
    this.radioButtonValue = this.normalValue;
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildSubmitBodyActionCallback(): () => void {
    return () => this.dialogRef.close(this.radioButtonValue);
  }

}

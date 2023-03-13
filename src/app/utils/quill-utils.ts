import { clone, Immutable, MakeUnique } from './ts-utils';

export interface DeltaOpInsertFormula {
  insert: { formula: string };
}

export interface DeltaOpInsertEmoji {
  insert: { emoji: string };
}

export interface DeltaOpInsertDSGVOVideo {
  insert: { 'dsgvo-video': string };
}

export interface DeltaOpInsertImage {
  insert: { image: string };
}

export interface DeltaOpInsertBacktrace {
  insert: '\n';
  attributes?: {
    list?: 'ordered' | 'bullet';
    blockquote?: true;
    'code-block'?: true;
  };
}

export interface DeltaOpInsertText {
  insert: string;
  attributes?: {
    link?: string;
    bold?: true;
    italic?: true;
    strike?: true;
    color?: string; // Hex String (lowercase)
  };
}

export type DeltaOpInsert =
  | DeltaOpInsertFormula
  | DeltaOpInsertEmoji
  | DeltaOpInsertDSGVOVideo
  | DeltaOpInsertImage
  | DeltaOpInsertBacktrace
  | DeltaOpInsertText;

export interface Delta<T> {
  ops: T[];
}

export enum URLType {
  NORMAL,
  YOUTUBE,
  VIMEO,
}

export type StandardDelta = Delta<DeltaOpInsert>;

export type ImmutableStandardDelta = Immutable<StandardDelta>;

export type SerializedDelta = MakeUnique<string>;

export type MarkdownDelta = MakeUnique<string>;

export class QuillUtils {
  static serializeDelta(delta: ImmutableStandardDelta): SerializedDelta {
    return JSON.stringify(
      delta.ops.map((op) => {
        const keys = Object.keys(op);
        return keys.length === 1 && keys[0] === 'insert' ? op['insert'] : op;
      }),
    ) as SerializedDelta;
  }

  static deserializeDelta(
    serialized: SerializedDelta,
    ignoreNotDefined = false,
  ): StandardDelta {
    let ops;
    try {
      ops = JSON.parse(serialized || null);
      if (ops === null || ops === undefined) {
        if (!ignoreNotDefined) {
          console.error('Ops is not defined.');
        }
        return { ops: [] };
      }
    } catch (e) {
      console.error(e);
      return { ops: [] };
    }
    return {
      ops: ops.map((elem) => {
        if (elem.insert === undefined) {
          return { insert: elem };
        } else {
          return elem;
        }
      }),
    };
  }

  static getTextFromDelta(delta: ImmutableStandardDelta): string {
    return delta.ops.reduce((acc, e) => {
      return acc + (typeof e.insert === 'string' ? e.insert : '');
    }, '');
  }

  static getMarkdownFromDelta(delta: ImmutableStandardDelta): MarkdownDelta {
    const t = new QuillMarkdownCreator();
    let counter = 0;
    for (let i = 0; i < delta.ops.length - 1; i++, counter++) {
      counter += t.insertNextElement(delta.ops[i], counter, false);
    }
    const i = delta.ops.length - 1;
    t.insertNextElement(delta.ops[i], counter, true);
    return t.getMarkdown() as MarkdownDelta;
  }

  static getDeltaFromMarkdown(markdown: MarkdownDelta): StandardDelta {
    const parser = new QuillMarkdownParser();
    markdown.split('\n').forEach((line) => parser.insertLine(line));
    return parser.getQuillDelta();
  }

  static getContentCount(delta: ImmutableStandardDelta): number {
    return delta.ops.reduce((acc, op) => {
      return (
        acc +
        (typeof op.insert === 'string' && op.insert.trim().length < 1 ? 0 : 1)
      );
    }, 0);
  }

  static getVideoUrl(url): [string, URLType] {
    let match =
      url.match(
        /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/,
      ) ||
      url.match(
        /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
      ) ||
      url.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/) ||
      url.match(
        /^(?:(https?):\/\/)?www\.youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/,
      );
    if (match && match[2].length === 11) {
      return [
        'https://www.youtube-nocookie.com/embed/' + match[2] + '?showinfo=0',
        URLType.YOUTUBE,
      ];
    }
    match = url.match(
      /^(?:(https?):\/\/)?(?:(?:www|player)\.)?vimeo\.com\/(\d+)/,
    );
    if (match) {
      return [
        (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/',
        URLType.VIMEO,
      ];
    }
    return [url, URLType.NORMAL];
  }

  static transformURLtoQuillLink(
    data: StandardDelta,
    transformToVideo: boolean,
  ) {
    data.ops = data.ops.reduce((acc, op) => {
      if (op?.['attributes']?.link || typeof op.insert !== 'string') {
        acc.push(op);
        return acc;
      }
      this.transformURLinString(op.insert, op, transformToVideo, acc);
      return acc;
    }, [] as DeltaOpInsert[]);
    return data;
  }

  private static transformURLinString(
    str: string,
    currentObject: DeltaOpInsert,
    transformToVideo: boolean,
    acc: DeltaOpInsert[],
  ) {
    let m: RegExpExecArray;
    let lastIndex = 0;
    const urlRegex = /(www\.|https?:\/\/)\S+/gi;
    while ((m = urlRegex.exec(str)) !== null) {
      if (m.index > lastIndex) {
        const substring = str.substring(lastIndex, m.index);
        acc.push({ ...currentObject, insert: substring } as DeltaOpInsert);
      }
      lastIndex = m.index + m[0].length;
      const link = m[1]?.toLowerCase() === 'www.' ? 'https://' + m[0] : m[0];
      const videoLink = transformToVideo && QuillUtils.getVideoUrl(link);
      if (videoLink) {
        acc.push({ insert: { 'dsgvo-video': videoLink[0] } });
      } else {
        acc.push({
          attributes: { ...currentObject['attributes'], link },
          insert: link,
        });
      }
    }
    if (lastIndex < str.length) {
      const substring = str.substring(lastIndex);
      acc.push({ ...currentObject, insert: substring } as DeltaOpInsert);
    }
  }
}

export class QuillMarkdownCreator {
  private entireDoc: string = '';
  private currentLine: string = '';
  private wasCodeBlock = false;
  private wasStroke = -1;
  private wasItalic = -1;
  private wasBold = -1;

  constructor() {}

  getMarkdown(): string {
    return this.entireDoc;
  }

  insertNextElement(e: DeltaOpInsert, i: number, isLast: boolean): number {
    if (!e) {
      console.warn('Passed falsy value to markdown creator');
      return 0;
    }
    if (this.handleSimple(e)) {
      return 0;
    }
    const num = this.handleMultiple(e, i, isLast);
    if (num > 0) {
      return num;
    }
    if (this.handleBacktrace(e as DeltaOpInsertBacktrace, isLast)) {
      return 0;
    }
    this.handleFormat(e as DeltaOpInsertText, i, isLast);
    return 0;
  }

  private handleFormat(e: DeltaOpInsertText, i: number, isLast: boolean) {
    let part = isLast ? e.insert.substring(0, e.insert.length) : e.insert;
    if (e.attributes?.link) {
      part = '[' + part + '](' + e.attributes.link + ')';
    }
    const isBold = Boolean(e.attributes?.bold);
    const arr = [];
    if (isBold !== this.wasBold > -1) {
      if (this.currentLine !== '' || isBold) {
        arr.push(['**', this.wasBold < 0 ? i : this.wasBold]);
      }
      this.wasBold = isBold ? i : -1;
    }
    const isStroke = Boolean(e.attributes?.strike);
    if (isStroke !== this.wasStroke > -1) {
      if (this.currentLine !== '' || isStroke) {
        arr.push(['~~', this.wasStroke < 0 ? i : this.wasStroke]);
      }
      this.wasStroke = isStroke ? i : -1;
    }
    const isItalic = Boolean(e.attributes?.italic);
    if (isItalic !== this.wasItalic > -1) {
      if (this.currentLine !== '' || isItalic) {
        arr.push(['*', this.wasItalic < 0 ? i : this.wasItalic]);
      }
      this.wasItalic = isItalic ? i : -1;
    }
    arr.sort((a, b) => b[1] - a[1]);
    arr.forEach((arr) => (part = arr[0] + part));
    this.currentLine += part;
  }

  private applyFormat() {
    const arr = [];
    if (this.wasBold > -1) {
      arr.push(['**', this.wasBold]);
    }
    if (this.wasStroke > -1) {
      arr.push(['~~', this.wasStroke]);
    }
    if (this.wasItalic > -1) {
      arr.push(['*', this.wasItalic]);
    }
    arr.sort((a, b) => b[1] - a[1]);
    arr.forEach((arr) => (this.currentLine += arr[0]));
  }

  private handleBacktrace(e: DeltaOpInsertBacktrace, isLast: boolean) {
    if (e.insert !== '\n') {
      return false;
    }
    const part = isLast ? '' : '\n';
    const isCodeBlock = Boolean(e.attributes?.['code-block']);
    if (e.attributes?.['list']) {
      if (e.attributes['list'] === 'bullet') {
        this.currentLine = '- ' + this.currentLine;
      } else if (e.attributes['list'] === 'ordered') {
        this.currentLine = '1. ' + this.currentLine;
      }
    } else if (e.attributes?.['blockquote']) {
      this.currentLine = '> ' + this.currentLine;
    } else {
      if (isCodeBlock) {
        if (!this.wasCodeBlock) {
          this.currentLine = '\n    ' + this.currentLine;
        } else {
          this.currentLine = '    ' + this.currentLine;
        }
      } else if (this.wasCodeBlock) {
        this.currentLine = '\n' + this.currentLine;
      }
      this.wasCodeBlock = isCodeBlock;
    }
    this.applyFormat();
    this.entireDoc += this.currentLine + part;
    this.currentLine = '';
    return true;
  }

  private handleMultiple(
    e: DeltaOpInsert,
    index: number,
    isLast: boolean,
  ): number {
    const part = e.insert as string;
    if (part !== '\n' && part.includes('\n')) {
      const data = part.split('\n');
      const lastPresent = data[data.length - 1].length > 0;
      const len = data.length - (lastPresent ? 1 : 2);
      for (let i = 0; i < len; i++) {
        this.insertNextElement({ insert: data[i] }, index + i, false);
        this.insertNextElement({ insert: '\n' }, index + i, false);
      }
      if (lastPresent) {
        this.insertNextElement({ insert: data[len] }, index + len, isLast);
      } else {
        this.insertNextElement({ insert: data[len] }, index + len, false);
        this.insertNextElement({ insert: '\n' }, index + len + 1, isLast);
      }
      return data.length - 1;
    }
    return 0;
  }

  private handleSimple(e: DeltaOpInsert) {
    if (e.insert?.['formula']) {
      this.currentLine += '$' + e.insert['formula'] + '$';
      return true;
    } else if (e.insert?.['emoji']) {
      this.currentLine += ':' + e.insert['emoji'] + ':';
      return true;
    } else if (e.insert?.['dsgvo-video']) {
      this.currentLine += '![video](' + e.insert['dsgvo-video'] + ')';
      return true;
    } else if (e.insert?.['image']) {
      this.currentLine += '![image](' + e.insert['image'] + ')';
      return true;
    }
    if (typeof e.insert !== 'string') {
      console.error('Unknown element', e);
      return true;
    }
    return false;
  }
}

const CODE_TICKS = /^ {0,3}```.*$/gm;
const CODE_INDENT_PRE = /^\s*$/gm;
const CODE_INDENT = /^(?: {4}|\t)(.*)$/gm;
const CITE = /^(?: {0,5}|\t)>\s*(.*)$/gm;
const LIST_ORDER = /^ {0,3}\d+\.\s+(.*)$/gm;
const LIST_DASH = /^ {0,3}(?:\*|\+|-)\s+(.*)$/gm;

const LINK = /\!?\[([^\]]*)\]\(([^)]*)\)/;
const FORMULA = /\${1,2}([^$]*)\${1,2}/;
const EMOJI = /:([a-zA-Z0-9-]+):/;
const TEXT_FORMAT = /(_|\*|~~)+/;

export class QuillMarkdownParser {
  private resultOps: DeltaOpInsert[] = [];
  private currentFormat: string | null = null;
  private lastLine: string = null;
  private currentLine: string = null;
  private isBold = false;
  private isItalic = false;
  private isStroke = false;

  public insertLine(line: string) {
    this.parseBacktrace(line);
  }

  public getQuillDelta(): StandardDelta {
    const len = this.resultOps.length;
    const backup = this.currentLine;
    this.pushCurrentLine();
    const newOps = clone(this.resultOps);
    this.currentLine = backup;
    this.resultOps.splice(len);
    return {
      ops: newOps,
    };
  }

  private parseBacktrace(line: string) {
    if (this.currentFormat === 'ticks') {
      const match = line.match(CODE_TICKS);
      if (match) {
        this.currentFormat = null;
      } else {
        this.resultOps.push({ insert: line });
        this.resultOps.push({
          insert: '\n',
          attributes: { 'code-block': true },
        });
      }
      return;
    }
    if (this.currentFormat === 'indentation') {
      const match = line.matchAll(CODE_INDENT).next().value;
      const preMatch = line.match(CODE_INDENT_PRE);
      if (match) {
        this.resultOps.push({ insert: match[1] });
        this.resultOps.push({
          insert: '\n',
          attributes: { 'code-block': true },
        });
      } else if (preMatch) {
        this.currentFormat = null;
      } else {
        this.currentLine = line;
        this.currentFormat = null;
      }
      return;
    }
    // no state
    let match: RegExpMatchArray = line.matchAll(CITE).next().value;
    if (match) {
      this.parseSimple(match[1], 'blockquote');
      this.resultOps.push({ insert: '\n', attributes: { blockquote: true } });
      return;
    }
    match = line.matchAll(LIST_ORDER).next().value;
    if (match) {
      this.parseSimple(match[1], 'list', false);
      this.resultOps.push({ insert: '\n', attributes: { list: 'ordered' } });
      return;
    }
    match = line.matchAll(LIST_DASH).next().value;
    if (match) {
      this.parseSimple(match[1], 'list', false);
      this.resultOps.push({ insert: '\n', attributes: { list: 'bullet' } });
      return;
    }
    match = line.matchAll(CODE_TICKS).next().value;
    if (match) {
      this.currentFormat = 'ticks';
      this.resetSimpleTracking();
      return;
    }
    match = line.matchAll(CODE_INDENT).next().value;
    if (match) {
      const lastMatch = this.lastLine?.match?.(CODE_INDENT_PRE);
      if (lastMatch) {
        this.parseSimple(match[1], 'indentation');
        this.resultOps.push({
          insert: '\n',
          attributes: { 'code-block': true },
        });
        return;
      }
    }
    this.parseSimple(line, null);
  }

  private parseSimple(line: string, format: string, saveFormat = true): void {
    if (format !== this.currentFormat) {
      this.pushCurrentLine();
      this.resetSimpleTracking();
      if (saveFormat) {
        this.currentFormat = format;
      }
    }
    this.lastLine = line;
    line = line.trim();
    this.parseTextStates(line, !format);
    if (format) {
      this.pushCurrentLine();
    }
  }

  private parseTextStates(line: string, addEndLine: boolean) {
    let index = 0;
    while (true) {
      line = line.substring(index);
      type Match = [string, RegExpMatchArray];
      const data: Match[] = [
        ['link', line.match(LINK)],
        ['emoji', line.match(EMOJI)],
        ['formula', line.match(FORMULA)],
        ['textFormat', line.match(TEXT_FORMAT)],
      ];
      const matchArr = this.posMin((d) => d[1]?.index ?? -1, ...data);
      if (matchArr === null) {
        this.addToCurrentLine(line);
        break;
      }
      const match = matchArr[1];
      const endIndex = match.index + match[0].length;
      this.addToCurrentLine(line.substring(0, match.index));
      switch (matchArr[0]) {
        case 'link':
          this.handleLink(match);
          break;
        case 'emoji':
          this.handleEmoji(match);
          break;
        case 'formula':
          this.handleFormula(match);
          break;
        case 'textFormat':
          this.handleTextFormat(line, match, endIndex);
          break;
        default:
          throw new Error('Should not happen: Match parse states');
      }
      index = endIndex;
    }
    if (this.isBold || this.isStroke || this.isItalic || addEndLine) {
      this.pushCurrentLine(addEndLine);
    }
  }

  private handleLink(match: RegExpMatchArray) {
    this.pushCurrentLine();
    this.resultOps.push({
      insert: match[1],
      attributes: {
        ...this.makeAttributes()?.attributes,
        link: match[2],
      },
    });
  }

  private handleEmoji(match: RegExpMatchArray) {
    this.pushCurrentLine();
    this.resultOps.push({
      insert: {
        emoji: match[1],
      },
    });
  }

  private handleFormula(match: RegExpMatchArray) {
    this.pushCurrentLine();
    this.resultOps.push({
      insert: {
        formula: match[1],
      },
    });
  }

  private handleTextFormat(
    line: string,
    match: RegExpMatchArray,
    endIndex: number,
  ) {
    const whitespace = ' \t\f\v\r\n';
    const isBefore = !whitespace.includes(line[endIndex] || ' ');
    const isAfter = !whitespace.includes(line[match.index - 1] || ' ');
    if (!isBefore && !isAfter) {
      this.addToCurrentLine(match[0]);
      return;
    }
    const currentState = [this.isBold, this.isItalic, this.isStroke];
    const found = this.calculateStates(match[0]);
    const newState = [...currentState].map((e, i) => {
      if (found[i]) {
        return isBefore && isAfter ? !e : isBefore;
      }
      return e;
    });
    if (currentState.every((e, i) => e === newState[i])) {
      return;
    }
    this.pushCurrentLine();
    this.isBold = newState[0];
    this.isItalic = newState[1];
    this.isStroke = newState[2];
  }

  private calculateStates(
    text: string,
  ): [bold: boolean, italic: boolean, stroke: boolean] {
    const result: [boolean, boolean, boolean] = [false, false, false];
    const data = text.split('~~');
    if (data.length > 1) {
      result[2] = true;
    }
    for (const part of data) {
      let lastChar = part[0];
      let count = 1;
      for (let i = 1; i < part.length; i++) {
        if (part[i] !== lastChar) {
          lastChar = part[i];
          result[0] = result[0] || count > 1;
          result[1] = result[1] || count % 2 === 1;
          count = 1;
          if (result[0] && result[1]) {
            return result;
          }
          continue;
        }
        count++;
      }
      if (lastChar) {
        result[0] = result[0] || count > 1;
        result[1] = result[1] || count % 2 === 1;
        if (result[0] && result[1]) {
          return result;
        }
      }
    }
    return result;
  }

  private posMin<T>(accessor: (t: T) => number, ...ts: T[]): T {
    const filtered = ts.filter((t) => accessor(t) >= 0);
    if (filtered.length < 1) {
      return null;
    }
    return filtered.sort((a, b) => accessor(a) - accessor(b))[0];
  }

  private addToCurrentLine(line: string) {
    this.currentLine =
      this.currentLine !== null ? this.currentLine + line : line;
  }

  private pushCurrentLine(withLineEnding = false) {
    if (!this.currentLine) {
      if (withLineEnding) {
        this.resultOps.push({ insert: '\n' });
      }
      return;
    }
    if (this.isBold || this.isStroke || this.isItalic) {
      this.resultOps.push({
        insert: this.currentLine,
        ...this.makeAttributes(),
      });
      if (withLineEnding) {
        this.resultOps.push({ insert: '\n' });
      }
      this.currentLine = null;
      return;
    }
    this.resultOps.push({
      insert: this.currentLine + (withLineEnding ? '\n' : ''),
    });
    this.currentLine = null;
  }

  private makeAttributes() {
    if (!this.isBold && !this.isStroke && !this.isItalic) {
      return undefined;
    }
    const attributes: DeltaOpInsertText['attributes'] = {};
    if (this.isBold) {
      attributes.bold = true;
    }
    if (this.isItalic) {
      attributes.italic = true;
    }
    if (this.isStroke) {
      attributes.strike = true;
    }
    return { attributes };
  }

  private resetSimpleTracking() {
    this.lastLine = null;
    this.isBold = false;
    this.isItalic = false;
    this.isStroke = false;
  }
}

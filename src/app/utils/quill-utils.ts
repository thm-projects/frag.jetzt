import { Immutable, MakeUnique } from './ts-utils';

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

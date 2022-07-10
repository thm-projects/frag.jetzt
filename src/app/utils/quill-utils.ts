import { Immutable, MakeUnique } from './ts-utils';
import {
  QuillInputDialogComponent
} from '../components/shared/_dialogs/quill-input-dialog/quill-input-dialog.component';

export interface DeltaOpInsert {
  insert: string | {
    image?: string;
    video?: string;
  };
  attributes?: {
    link?: string;
    color?: string;
    header?: number;
    bold?: boolean;
    italic?: boolean;
  };
}

export interface Delta<T> {
  ops: T[];
}

export type StandardDelta = Delta<DeltaOpInsert>;

export type ImmutableStandardDelta = Immutable<StandardDelta>;

export type SerializedDelta = MakeUnique<string>;

export class QuillUtils {

  static serializeDelta(delta: ImmutableStandardDelta): SerializedDelta {
    return JSON.stringify(delta.ops.map(op => {
      const keys = Object.keys(op);
      return keys.length === 1 && keys[0] === 'insert' ? op['insert'] : op;
    })) as SerializedDelta;
  }

  static deserializeDelta(serialized: SerializedDelta): StandardDelta {
    let ops;
    try {
      ops = JSON.parse(serialized || null);
      if (ops === null || ops === undefined) {
        console.error('Ops is not defined.');
        return { ops: [] };
      }
    } catch (e) {
      console.error(e);
      return { ops: [] };
    }
    return {
      ops: ops.map(elem => {
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

  static getContentCount(delta: ImmutableStandardDelta): number {
    return delta.ops.reduce((acc, op) => {
      return acc + (typeof op.insert === 'string' && op.insert.trim().length < 1 ? 0 : 1);
    }, 0);
  }

  static transformURLtoQuillLink(data: StandardDelta, transformToVideo: boolean) {
    data.ops = data.ops.reduce((acc, op) => {
      if (op.attributes?.link || typeof op.insert !== 'string') {
        acc.push(op);
        return acc;
      }
      this.transformURLinString(op.insert, op, transformToVideo, acc);
      return acc;
    }, [] as DeltaOpInsert[]);
    return data;
  }

  private static transformURLinString(str: string, currentObject: DeltaOpInsert, transformToVideo: boolean, acc: DeltaOpInsert[]) {
    let m: RegExpExecArray;
    let lastIndex = 0;
    const urlRegex = /(www\.|https?:\/\/)\S+/gi;
    while ((m = urlRegex.exec(str)) !== null) {
      if (m.index > lastIndex) {
        const substring = str.substring(lastIndex, m.index);
        acc.push({ ...currentObject, insert: substring });
      }
      lastIndex = m.index + m[0].length;
      const link = m[1]?.toLowerCase() === 'www.' ? 'https://' + m[0] : m[0];
      const videoLink = transformToVideo && QuillInputDialogComponent.getVideoUrl(link);
      if (videoLink) {
        acc.push({ insert: { video: videoLink } });
      } else {
        acc.push({ attributes: { ...currentObject.attributes, link }, insert: link });
      }
    }
    if (lastIndex < str.length) {
      const substring = str.substring(lastIndex);
      acc.push({ ...currentObject, insert: substring });
    }
  }
}

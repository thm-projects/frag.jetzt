import { Immutable, MakeUnique } from './ts-utils';

export interface DeltaOpInsert {
  insert: string | {
    image?: string;
    'dsgvo-video'?: string;
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

export enum URLType {
  NORMAL,
  YOUTUBE,
  VIMEO,
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

  static deserializeDelta(serialized: SerializedDelta, ignoreNotDefined = false): StandardDelta {
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

  static getVideoUrl(url): [string, URLType] {
    let match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
      url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
      url.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/) ||
      url.match(/^(?:(https?):\/\/)?www\.youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (match && match[2].length === 11) {
      return ['https://www.youtube-nocookie.com/embed/' + match[2] + '?showinfo=0', URLType.YOUTUBE];
    }
    match = url.match(/^(?:(https?):\/\/)?(?:(?:www|player)\.)?vimeo\.com\/(\d+)/);
    if (match) {
      return [(match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/', URLType.VIMEO];
    }
    return [url, URLType.NORMAL];
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
      const videoLink = transformToVideo && QuillUtils.getVideoUrl(link);
      if (videoLink) {
        acc.push({ insert: { 'dsgvo-video': videoLink[0] } });
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

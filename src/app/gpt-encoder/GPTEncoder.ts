import { MakeUnique } from 'app/utils/ts-utils';

const PATTERN =
  /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;

const textEncoder = new TextEncoder();
const encodeStr = (str: string): number[] => {
  return Array.from(textEncoder.encode(str));
};

const textDecoder = new TextDecoder('utf-8');
const decodeStr = (arr: number[]): string => {
  return textDecoder.decode(new Uint8Array(arr));
};

type NumberAsString = MakeUnique<number>;

class ByteEncoder {
  public static readonly BYTE_ENCODER: { [key: NumberAsString]: string } = {};
  public static readonly BYTE_DECODER: { [key: string]: NumberAsString } = {};

  static {
    // Init byte encoder
    const ord = (x: string): number => {
      return x.charCodeAt(0);
    };
    const chr = (x: number) => {
      return String.fromCharCode(x);
    };
    const max = 2 ** 8;
    const ranges: [number, number][] = [
      [ord('!'), ord('~') + 1],
      [ord('¡'), ord('¬') + 1],
      [ord('®'), ord('ÿ') + 1],
    ];
    let start = 0;
    let end: number;
    let n = 0;
    while (ranges.length > 0) {
      const range = ranges.shift();
      end = range?.[0] ?? max;
      for (let i = start; i < end; i++) {
        this.BYTE_ENCODER[i] = chr(max + n++);
      }
      if (range === undefined) {
        break;
      }
      start = end;
      end = range[1];
      for (let i = start; i < end; i++) {
        this.BYTE_ENCODER[i] = chr(i);
      }
      start = end;
    }
    // Init byte decoder
    Object.keys(this.BYTE_ENCODER).forEach((key) => {
      this.BYTE_DECODER[this.BYTE_ENCODER[key]] =
        key as unknown as NumberAsString;
    });
  }
}

export class GPTEncoder {
  private decoder: object;
  private cache: { [key: string]: string } = {};
  private bpe_ranks: { [key: string]: number } = {};

  constructor(private encoder: object, bpeData: string) {
    // create decoder
    this.decoder = {};
    Object.keys(encoder).map((x) => {
      this.decoder[encoder[x]] = x;
    });
    // build bpe data
    const lines = bpeData.split('\n');
    // Remove comment at the start and line ending at the end
    const filteredLines = lines.slice(1, lines.length - 1);
    const bpe_merges = filteredLines.map((x) => {
      return x.split(/(\s+)/).filter((e) => e.trim().length > 0);
    });
    bpe_merges.forEach((line, i) => {
      this.bpe_ranks[line.join(',')] = i;
    });
  }

  public encode(text: string): number[] {
    return this.matchAllArray(text, PATTERN)
      .map((x) => x[0])
      .reduce((acc, current) => {
        const token = encodeStr(current)
          .map((x) => ByteEncoder.BYTE_ENCODER[x])
          .join('');
        const new_tokens = this.bpe(token)
          .split(' ')
          .map((x) => this.encoder[x]);
        return acc.concat(new_tokens);
      }, []);
  }

  public decode(tokens: number[]): string {
    let text = tokens.map((x) => this.decoder[x]).join('');
    text = decodeStr(text.split('').map((x) => ByteEncoder.BYTE_DECODER[x]));
    return text;
  }

  private matchAllArray(text: string, pattern: RegExp) {
    const result = [];
    let m: RegExpExecArray;
    while ((m = pattern.exec(text)) !== null) {
      if (m.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
      result.push(m);
    }
    return result;
  }

  private get_pairs(word: string[]): Set<[string, string]> {
    const pairs = new Set<[string, string]>();
    let prev_char = word[0];
    for (let i = 1; i < word.length; i++) {
      const char = word[i];
      pairs.add([prev_char, char]);
      prev_char = char;
    }
    return pairs;
  }

  private bpe(token: string): string {
    const cacheEntry = this.cache[token];
    if (cacheEntry !== undefined) {
      return cacheEntry;
    }

    let word = token.split('');

    let pairs = this.get_pairs(word);

    if (!pairs) {
      return token;
    }

    while (true) {
      const minPairs: { [key: NumberAsString]: string } = {};
      Array.from(pairs).map((pair) => {
        const rank = this.bpe_ranks[pair[0] + ',' + pair[1]];
        minPairs[isNaN(rank) ? 10e10 : rank] = pair;
      });

      const bigram =
        minPairs[
          Math.min(
            ...Object.keys(minPairs).map((x) => {
              return parseInt(x, 10);
            }),
          )
        ];

      if (!(bigram in this.bpe_ranks)) {
        break;
      }

      const first = bigram[0];
      const second = bigram[1];
      let new_word = [];
      let i = 0;

      while (i < word.length) {
        const j = word.indexOf(first, i);
        if (j === -1) {
          new_word = new_word.concat(word.slice(i));
          break;
        }
        new_word = new_word.concat(word.slice(i, j));
        i = j;

        if (
          word[i] === first &&
          i < word.length - 1 &&
          word[i + 1] === second
        ) {
          new_word.push(first + second);
          i = i + 2;
        } else {
          new_word.push(word[i]);
          i = i + 1;
        }
      }

      word = new_word;
      if (word.length === 1) {
        break;
      } else {
        pairs = this.get_pairs(word);
      }
    }

    const resultWord = word.join(' ');
    this.cache[token] = resultWord;

    return resultWord;
  }
}

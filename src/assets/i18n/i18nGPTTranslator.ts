import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { Observable, from, map, forkJoin } from 'rxjs';
import { Configuration, OpenAIApi } from 'openai';
import { GPTEncoder } from '../../app/gpt-encoder/GPTEncoder';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const folder = '../';

const encoderData = JSON.parse(
  readFileSync(folder + 'config/gpt/encoder.json', {
    encoding: 'utf8',
  }),
);
const bpe = readFileSync(folder + 'config/gpt/vocab.bpe', {
  encoding: 'utf8',
});
const encoder = new GPTEncoder(encoderData, bpe);

const quoteFixer = /(?<!^|\\)"(?!(,|:\[|: \[)?$)/gm;

class LanguageDirectory {
  constructor(private directory: string, private languages: string[]) {}

  public read(lang: string) {
    return JSON.parse(
      readFileSync(this.directory + lang + '.json', {
        encoding: 'utf8',
      }),
    );
  }

  public write(lang: string, object: object) {
    writeFileSync(
      this.directory + lang + '.json',
      JSON.stringify(object, undefined, 2) + '\n',
      {
        encoding: 'utf8',
      },
    );
  }

  public makeRequest(object: object): Observable<object> {
    const parts = this.calculateParts(object, 800);
    return forkJoin(
      parts.map((part) =>
        this.translatePart(
          'Spanish',
          part
            .replace(/<\|endoftext\|>/gi, '\ue000')
            .replace(/\u0003/gi, '\ue001'),
        ),
      ),
    ).pipe(
      map((data) => {
        const translatedKeys = data.reduce((acc, arg) => {
          const start = arg.indexOf('{');
          let end = arg.lastIndexOf('}\n');
          if (end < 0) {
            end = arg.lastIndexOf('}');
          }
          const filtered = arg
            .substring(start, end < 0 ? arg.length : end + 1)
            .replace(quoteFixer, '\\"')
            .replace(/\ue000/gi, '<|endoftext|>')
            .replace(/\ue001/gi, '\u0003');
          const obj = JSON.parse(filtered);
          acc.push(...obj[Object.keys(obj)[0]]);
          return acc;
        }, []);
        return this.unshiftKeys(object, translatedKeys);
      }),
    );
  }

  private unshiftKeys(object: object, keys: string[]): object {
    return this.untraverse(
      object,
      (jsonString, context) => {
        return keys.shift();
      },
      [],
    );
  }

  private calculateParts(object: object, threshold: number): string[] {
    const start = '{\n"language-data": [\n';
    const result = [];
    let current = start;
    let first = true;
    this.traverse(
      object,
      (jsonStr) => {
        if (encoder.encode(current + jsonStr).length > threshold) {
          result.push(current + '\n]\n}');
          current = start;
          first = true;
        }
        if (first) {
          first = false;
        } else {
          current += ',\n';
        }
        current += jsonStr;
      },
      [],
    );
    if (current !== start) {
      result.push(current + '\n]\n}');
    }
    return result;
  }

  private untraverse(
    object: object,
    contextReducer: (
      jsonString: string,
      context: (number | string)[],
    ) => string,
    context: (number | string)[],
  ): any {
    if (Array.isArray(object)) {
      object.forEach(
        (e, i, arr) =>
          (arr[i] = this.untraverse(e, contextReducer, [...context, i])),
      );
      return object;
    } else if (typeof object === 'object') {
      for (const key of Object.keys(object)) {
        object[key] = this.untraverse(object[key], contextReducer, [
          ...context,
          key,
        ]);
      }
      return object;
    } else {
      return contextReducer(JSON.stringify(object), context);
    }
  }

  private traverse(
    object: any,
    contextAdder: (jsonString: string, context: (number | string)[]) => void,
    context: (number | string)[],
  ) {
    if (Array.isArray(object)) {
      object.forEach((e, i) => this.traverse(e, contextAdder, [...context, i]));
    } else if (typeof object === 'object') {
      for (const key of Object.keys(object)) {
        this.traverse(object[key], contextAdder, [...context, key]);
      }
    } else {
      contextAdder(JSON.stringify(object), context);
    }
  }

  private translatePart(
    languageName: string,
    part: string,
  ): Observable<string> {
    return from(
      openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `I want to translate a language file in JSON format into ${languageName}. The translation should keep the structure of the file and translate only the values.
        If possible use an informal language with a modern style. The style of the texts should be improved, but the sense should be preserved. Finally, make sure that especially short texts remain short, so that they still look good on call-to-action buttons.
        
        Language file: ###
        ${part}
        ###\u0003`,
        max_tokens: 2000,
      }),
    ).pipe(
      map((response) => {
        return response.data.choices[0].text;
      }),
    );
  }
}

const findFiles = (): LanguageDirectory[] => {
  const arr: LanguageDirectory[] = [];
  const findInFolder = (folderName: string) => {
    const languages: string[] = [];
    readdirSync(folderName, {
      encoding: 'utf8',
      withFileTypes: true,
    }).forEach((c) => {
      if (c.isDirectory()) {
        findInFolder(folderName + c.name + '/');
      } else if (
        c.isFile() &&
        c.name.length === 7 &&
        c.name.endsWith('.json')
      ) {
        languages.push(c.name.substring(0, c.name.length - 5));
      }
    });
    if (languages.length) {
      arr.push(new LanguageDirectory(folderName, languages));
    }
  };
  findInFolder(folder);
  return arr;
};

const test = findFiles()[0];
const obj = test.read('en');
test.makeRequest(obj).subscribe((e) => {
  test.write('test', e);
});

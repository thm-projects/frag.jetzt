import { GPTEncoder } from '#app/gpt-encoder/GPTEncoder';
import { Configuration, OpenAIApi } from 'openai';
import {
  BehaviorSubject,
  filter,
  take,
  map,
  timer,
  mergeMap,
  Observable,
  ReplaySubject,
  defer,
  tap,
} from 'rxjs';
import { LanguageDirectory } from './i18nGPTTranslator';
import { JsonSplitter } from './splitter-strategy/JSONSplitter';
import { config } from 'dotenv';

config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const rateLimit = (count: number, slidingWindowTime: number) => {
  let tokens = count;
  const tokenChanged = new BehaviorSubject(tokens);
  const consumeToken = () => tokenChanged.next(--tokens);
  const renewToken = () => tokenChanged.next(++tokens);
  const availableTokens = tokenChanged.pipe(filter(() => tokens > 0));

  return (source) => {
    return source.pipe(
      mergeMap((value) => {
        return availableTokens.pipe(
          take(1),
          map(() => {
            consumeToken();
            return value;
          }),
        );
      }),
      map((observable) => {
        return (observable as Observable<any>).pipe(
          tap(() => {
            timer(slidingWindowTime).subscribe(renewToken);
          }),
        );
      }),
    );
  };
};

export class ForbiddenTranslationChecker {
  constructor(private readonly keys: string[]) {
    keys.sort((a, b) => a.localeCompare(b));
  }

  isAllowed(context: string[]) {
    return !this.searchBinary(context.join('.'));
  }

  private searchBinary(key: string): boolean {
    let left = 0;
    let right = this.keys.length - 1;
    while (right >= left) {
      const mid = left + Math.floor((right - left) / 2);
      const compared = this.keys[mid].localeCompare(key);
      if (compared === 0) {
        return true;
      } else if (compared < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return false;
  }
}

const DO_NOT_TRANSLATE: [string, ForbiddenTranslationChecker][] = [
  [
    '/admin/',
    new ForbiddenTranslationChecker([
      'gpt-chat.greetings.code-davinci-002.0.key',
      'gpt-chat.greetings.code-davinci-002.0.value',
    ]),
  ],
];

export class Translator {
  private subject = new ReplaySubject<Observable<any>>();

  constructor(
    private encoder: GPTEncoder,
    private readonly languageName: string,
    private readonly newLanguage: string,
  ) {}

  addInputs(languageFolders: LanguageDirectory[]) {
    languageFolders.forEach((folder) => this.addInput(folder));
  }

  addInput(languageFolder: LanguageDirectory) {
    console.log('Loading ' + languageFolder.directory);
    if (languageFolder.has(this.newLanguage)) {
      console.log('Already present');
      return;
    }
    const forbidden = DO_NOT_TRANSLATE.find((e) =>
      languageFolder.directory.endsWith(e[0]),
    );
    const splitter = new JsonSplitter(
      this.encoder,
      !forbidden ? null : forbidden[1],
    );
    const obj = languageFolder.read('en');
    const parts = splitter.calculateParts(obj, 1000);
    const count = parts.length;
    const arr = new Array(count).fill(null);
    parts.forEach((part, i) => {
      this.subject.next(
        this.makeObservable(languageFolder, part, i + 1, count).pipe(
          map((text) => {
            arr[i] = text;
            if (arr.every((e) => Boolean(e))) {
              try {
                splitter.reconstructFromTranslatedParts(obj, arr);
                languageFolder.write(this.newLanguage, obj);
                console.log(languageFolder.directory + ' completed!');
              } catch (e) {
                console.log(languageFolder.directory + ' failed!');
                console.error(e);
              }
            }
            return text;
          }),
        ),
      );
    });
  }

  await() {
    console.log('Start work...');
    this.subject.pipe(rateLimit(6, 20_000)).subscribe((obs) => {
      (obs as Observable<any>).subscribe();
    });
  }

  private makeObservable(
    languageFolder: LanguageDirectory,
    part: string,
    i: number,
    count: number,
  ) {
    return defer(() => {
      part = part
        .replace(/<\|endoftext\|>/gi, '\ue000')
        .replace(/\u0003/gi, '\ue001');
      console.log(
        'Sending request for ' +
          languageFolder.directory +
          ' ' +
          i +
          '/' +
          count,
      );
      return openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an language assistant, which translates JSON files from english into ' +
              this.languageName +
              '. ' +
              'The translation should keep the structure of the file and translate only the values. ' +
              'If possible use an informal language with a modern style. ' +
              'The style of the texts should be improved, but the sense should be preserved. ' +
              'Finally, make sure that especially short texts remain short, so that they still look good on call-to-action buttons.',
          },
          {
            role: 'user',
            content: part,
          },
        ],
        max_tokens: 3000,
        temperature: 0,
      });
    }).pipe(
      map((response) => {
        if (response.data.choices[0].finish_reason) {
          console.log(
            'Request ' +
              languageFolder.directory +
              ' ' +
              i +
              '/' +
              count +
              ': ' +
              response.data.choices[0].finish_reason,
          );
        } else {
          console.log(
            'Finished Request ' +
              languageFolder.directory +
              ' ' +
              i +
              '/' +
              count,
          );
        }
        return response.data.choices[0].message.content
          .replace(/\ue000/gi, '<|endoftext|>')
          .replace(/\ue001/gi, '\u0003');
      }),
    );
  }
}

import { readdirSync, readFileSync, writeFileSync } from 'fs';

import { config } from 'dotenv';
import { Translator } from './RateLimiter';
import { GPTEncoder } from '#app/gpt-encoder/GPTEncoder';

config();

export interface Splitter {
  calculateParts(data: any, threshold: number): string[];
  reconstructFromTranslatedParts(originData: any, translations: string[]): any;
}

const assetsFolder = '../../src/assets/';
const configFolder = assetsFolder + 'config/';
const i18nFolder = assetsFolder + 'i18n/';

const encoderData = JSON.parse(
  readFileSync(configFolder + 'gpt/encoder.json', {
    encoding: 'utf8',
  }),
);
const bpe = readFileSync(configFolder + 'gpt/vocab.bpe', {
  encoding: 'utf8',
});
const encoder = new GPTEncoder(encoderData, bpe);

export class LanguageDirectory {
  constructor(public readonly directory: string, private languages: string[]) {}

  public read(lang: string) {
    return JSON.parse(
      readFileSync(this.directory + lang + '.json', {
        encoding: 'utf8',
      }),
    );
  }

  public has(lang: string): boolean {
    return this.languages.includes(lang);
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
}

const findFiles = (fileMatch: RegExp): LanguageDirectory[] => {
  const arr: LanguageDirectory[] = [];
  const findInFolder = (folderName: string) => {
    const languages: string[] = [];
    readdirSync(folderName, {
      encoding: 'utf8',
      withFileTypes: true,
    }).forEach((c) => {
      if (c.isDirectory()) {
        findInFolder(folderName + c.name + '/');
      } else if (c.isFile() && fileMatch.test(c.name)) {
        languages.push(c.name.split('.', 1)[0]);
      }
    });
    if (languages.length) {
      arr.push(new LanguageDirectory(folderName, languages));
    }
  };
  findInFolder(i18nFolder);
  return arr;
};

const translator = new Translator(encoder, 'Portuguese', 'pt');
translator.addInputs(findFiles(/^[a-z]{2}\.json$/));
translator.await();

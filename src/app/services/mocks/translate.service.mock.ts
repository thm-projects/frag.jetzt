import { Injectable } from '@angular/core';
import {
  FakeMissingTranslationHandler,
  MissingTranslationHandler,
  TranslateCompiler,
  TranslateDefaultParser,
  TranslateFakeCompiler,
  TranslateFakeLoader,
  TranslateLoader,
  TranslateParser,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';

@Injectable()
export class TranslateServiceMock extends TranslateService {
  constructor() {
    const translateStore: TranslateStore = new TranslateStore();
    const currentLoader: TranslateLoader = new TranslateFakeLoader();
    const compiler: TranslateCompiler = new TranslateFakeCompiler();
    const parser: TranslateParser = new TranslateDefaultParser();
    const missingTranslationHandler: MissingTranslationHandler = new FakeMissingTranslationHandler();

    super(translateStore, currentLoader, compiler, parser, missingTranslationHandler, true, true, true, 'en');
  }
}

import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { ForbiddenTranslationChecker } from '../RateLimiter';
import { JSONPlainBuilder, JSONPlainReconstructor } from './JSONPlain';

export type JSONContext = (string | number)[];

export interface Builder {
  addElement(encodedElement: string, context: JSONContext): void;
  build(): string[];
}

export interface Reconstructor {
  reconstructElement(
    previousEncodedElement: string,
    context: JSONContext,
  ): void;
  verify(): void;
}

export type BuilderConstructor = new (
  encode: GPTEncoder,
  threshold: number,
) => Builder;

export type ReconstructorConstructor = new (
  translations: string[],
) => Reconstructor;

const quoteFixer = /(?<!^|\\)"(?!(,|:\[|: \[)?$)/gm;

export class JsonSplitter {
  constructor(
    private encoder: GPTEncoder,
    private forbiddenChecker: ForbiddenTranslationChecker | null,
    private builder: BuilderConstructor = JSONPlainBuilder,
    private reconstructor: ReconstructorConstructor = JSONPlainReconstructor,
  ) {}

  public calculateParts(data: any, threshold: number): string[] {
    const builderRef = new this.builder(this.encoder, threshold);
    this.traverse(
      data,
      this.checkForbidden(builderRef.addElement.bind(builderRef)),
    );
    return builderRef.build();
  }

  public reconstructFromTranslatedParts(
    originData: any,
    translations: string[],
  ): any {
    const keys = translations.reduce((acc, arg) => {
      const start = arg.indexOf('{');
      let end = arg.lastIndexOf('}\n');
      if (end < 0) {
        end = arg.lastIndexOf('}');
      }
      const filtered = arg
        .substring(start, end < 0 ? arg.length : end + 1)
        .replace(quoteFixer, '\\"');
      let obj;
      try {
        obj = JSON.parse(filtered);
      } catch (e) {
        console.log(filtered + '\n\n' + arg);
        throw e;
      }
      acc.push(...obj[Object.keys(obj)[0]]);
      return acc;
    }, []);
    const reconstructorRef = new this.reconstructor(keys);
    const result = this.untraverse(
      originData,
      this.checkForbidden(
        reconstructorRef.reconstructElement.bind(reconstructorRef),
      ),
    );
    reconstructorRef.verify();
    return result;
  }

  private untraverse(
    object: object,
    contextReducer: (element: any, context: JSONContext) => string,
    context: JSONContext = [],
  ): any {
    if (Array.isArray(object)) {
      object.forEach(
        (e, i) =>
          (object[i] = this.untraverse(e, contextReducer, [...context, i])),
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
      return contextReducer(object, context);
    }
  }

  private traverse(
    object: any,
    contextAdder: (element: any, context: JSONContext) => void,
    context: JSONContext = [],
  ) {
    if (Array.isArray(object)) {
      object.forEach((e, i) => this.traverse(e, contextAdder, [...context, i]));
    } else if (typeof object === 'object') {
      for (const key of Object.keys(object)) {
        this.traverse(object[key], contextAdder, [...context, key]);
      }
    } else {
      contextAdder(object, context);
    }
  }

  private checkForbidden<T>(
    func: (element: any, context: JSONContext) => T,
  ): (element: any, context: JSONContext) => T {
    if (!this.forbiddenChecker) {
      return func;
    }
    return (element: any, context: JSONContext) => {
      if (
        !this.forbiddenChecker.isAllowed(
          context.map((s) => (typeof s === 'string' ? s : String(s))),
        )
      ) {
        return element as T;
      }
      return func(element, context);
    };
  }
}

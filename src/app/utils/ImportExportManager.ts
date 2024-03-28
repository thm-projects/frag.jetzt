import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MapperConfiguration {
  additional: string[];
  key: string;
}

export type ExportEmptyLine = null;

export interface ExportItemValue<T> {
  type: 'value';
  languageKey: string;
  additionalLanguageKeys?: string[];
  valueMapper?: {
    export: (config: MapperConfiguration, t: T) => string;
    import: (config: MapperConfiguration, value: string) => T;
  };
}

export interface ExportItemValues<T> {
  type: 'values';
  languageKey: string;
  additionalLanguageKeys?: string[];
  valueMapper?: {
    export: (config: MapperConfiguration, ts: T[]) => string[];
    import: (config: MapperConfiguration, values: string[]) => T[];
  };
}

export interface ExportTable<K> {
  type: 'table';
  columns: {
    languageKey: string;
    additionalLanguageKeys?: string[];
    valueMapper: {
      export: (config: MapperConfiguration, k: K) => string;
      import: (
        config: MapperConfiguration,
        value: string,
        previous: Partial<K>,
      ) => Partial<K>;
    };
  }[];
}

export type ExportStructureItem =
  | ExportEmptyLine
  | ExportItemValue<unknown>
  | ExportItemValues<unknown>
  | ExportTable<unknown>;

class CSVParser {
  private readonly parser: RegExp;
  private finished = false;

  /**
   Not a perfect parser, but for our data it will always work.
   Does not recognize invalid CSV formats, sometimes it just works when it should not.
   */
  constructor(
    private csvData: string,
    private cellSeparator: string,
    private lineSeparators: string[],
    private stringEscapeCharacter: string,
  ) {
    this.parser = new RegExp(
      this.cellSeparator +
        '|' +
        '(' +
        this.stringEscapeCharacter +
        '[^' +
        this.stringEscapeCharacter +
        ']*' +
        this.stringEscapeCharacter +
        ')|' +
        '(' +
        this.lineSeparators.join('|') +
        '|$)',
      'g',
    );
  }

  readNextLine(): string[] {
    if (this.finished) {
      return null;
    }
    let lastIndex = this.parser.lastIndex;
    const data = [];
    let strData = '';
    let m;
    while ((m = this.parser.exec(this.csvData)) !== null) {
      strData += this.csvData.substring(lastIndex, m.index);
      lastIndex = this.parser.lastIndex;
      if (m[1]) {
        strData += m[1];
        continue;
      }
      if (!m[2] || strData) {
        data.push(strData);
      }
      strData = '';
      if (m[2]) {
        return data;
      }
    }
    this.finished = true;
    return data;
  }
}

export class ImportExportManager {
  private readonly doubleStringEscapeCharacter: string;
  private readonly lineSeparatorRegex: RegExp;

  constructor(
    private translationService: TranslateService,
    private structure: ExportStructureItem[],
    private cellSeparator = ';',
    private lineSeparators = ['\r\n', '\n'],
    private stringEscapeCharacter = '"',
  ) {
    this.lineSeparatorRegex = new RegExp(this.lineSeparators.join('|'), 'g');
    this.doubleStringEscapeCharacter = this.stringEscapeCharacter.repeat(2);
    this.structure.forEach((e) => {
      if (e?.type === 'table' && e.columns.length < 1) {
        throw new Error('Cant create an empty table!');
      }
    });
  }

  exportToCSV(data: unknown[]): Observable<string> {
    return this.translationService.get(this.createTranslationKeys()).pipe(
      map((trans) => {
        let index = 0;
        let result = '';
        this.structure.forEach((item) => {
          if (!item) {
            result += this.cellSeparator + this.lineSeparators[0];
            return;
          }
          let key;
          let value = data[index++];
          let rows;
          switch (item.type) {
            case 'value':
              key = trans[item.languageKey];
              result += this.escape(key) + this.cellSeparator;
              if (item.valueMapper) {
                value = item.valueMapper.export(
                  this.buildMappingObject(
                    key,
                    trans,
                    item.additionalLanguageKeys,
                  ),
                  value,
                );
              }
              result +=
                this.escape(value as string) +
                this.cellSeparator +
                this.lineSeparators[0];
              break;
            case 'values':
              key = trans[item.languageKey];
              result += this.escape(key) + this.cellSeparator;
              if (item.valueMapper) {
                value = item.valueMapper.export(
                  this.buildMappingObject(
                    key,
                    trans,
                    item.additionalLanguageKeys,
                  ),
                  value as unknown[],
                );
              }
              result =
                (value as string[]).reduce(
                  (acc, e) => acc + this.escape(e) + this.cellSeparator,
                  result,
                ) + this.lineSeparators[0];
              break;
            case 'table':
              rows = new Array((value as unknown[]).length).fill('');
              item.columns.forEach((col) => {
                key = trans[col.languageKey];
                result += this.escape(key) + this.cellSeparator;
                const mapperObj = this.buildMappingObject(
                  key,
                  trans,
                  col.additionalLanguageKeys,
                );
                (value as unknown[]).forEach(
                  (e, j) =>
                    (rows[j] +=
                      this.escape(col.valueMapper.export(mapperObj, e)) +
                      this.cellSeparator),
                );
              });
              result +=
                this.lineSeparators[0] +
                rows.join(this.lineSeparators[0]) +
                this.lineSeparators[0];
              result += this.lineSeparators[0];
              break;
            default:
              console.error('Discarded data on output: ' + value);
              break;
          }
        });
        return result;
      }),
    );
  }

  importFromCSV(str: string): Observable<unknown[]> {
    return this.translationService.get(this.createTranslationKeys()).pipe(
      map((trans) => {
        const parser = new CSVParser(
          str,
          this.cellSeparator,
          this.lineSeparators,
          this.stringEscapeCharacter,
        );
        const result = [];
        this.structure.forEach((item) => {
          const line = parser.readNextLine();
          if (!item) {
            if (line.length > 1 && line[0].trim() !== '') {
              console.error('Discarded data on input: ' + line);
            }
            return;
          }
          if (line.length < 2) {
            console.error(
              'Discarded data on input (no matching structure): ' + line,
            );
            return;
          }
          const key = this.unescape(line[0]);
          this.readWithStructuredItemType(
            item,
            line,
            key,
            trans,
            parser,
            result,
          );
        });
        return result;
      }),
    );
  }

  private readWithStructuredItemType(
    item: ExportStructureItem,
    line: string[],
    key: string,
    translateObject: Record<string, string>,
    parser: CSVParser,
    result: unknown[],
  ) {
    let value;
    let cols;
    let data = [];
    let dataLine: string[];
    switch (item.type) {
      case 'value':
        value = this.unescape(line[1]);
        if (item.valueMapper) {
          value = item.valueMapper.import(
            this.buildMappingObject(
              key,
              translateObject,
              item.additionalLanguageKeys,
            ),
            value,
          );
        }
        result.push(value);
        break;
      case 'values':
        value = line.slice(1).map((e) => this.unescape(e));
        if (item.valueMapper) {
          value = item.valueMapper.import(
            this.buildMappingObject(
              key,
              translateObject,
              item.additionalLanguageKeys,
            ),
            value,
          );
        }
        result.push(value);
        break;
      case 'table':
        cols = line.map((e, i) =>
          this.buildMappingObject(
            this.unescape(e),
            translateObject,
            item.columns[i].additionalLanguageKeys,
          ),
        );
        data = [];
        while ((dataLine = parser.readNextLine()) !== null) {
          if (dataLine.length < item.columns.length) {
            break;
          }
          data.push(
            item.columns.reduce(
              (acc, col, i) =>
                col.valueMapper.import(
                  cols[i],
                  this.unescape(dataLine[i]),
                  acc,
                ),
              null,
            ),
          );
        }
        result.push(data);
        break;
      default:
        console.error('Discarded data on input (missing structure): ' + line);
        break;
    }
  }

  private unescape(value: string): string {
    let trimmed = value.trim();
    if (
      !trimmed.startsWith(this.stringEscapeCharacter) ||
      !trimmed.endsWith(this.stringEscapeCharacter)
    ) {
      return value;
    }
    if (this.lineSeparators.length > 1) {
      trimmed = trimmed
        .replace(/\\n/g, this.lineSeparators[this.lineSeparators.length - 1])
        .replace(/\\\\/g, '\\');
    }
    return trimmed
      .substring(1, trimmed.length - 1)
      .replace(
        new RegExp(this.doubleStringEscapeCharacter, 'g'),
        this.stringEscapeCharacter,
      );
  }

  private escape(value: string): string {
    value = value || '';
    if (
      value.indexOf(this.stringEscapeCharacter) < 0 &&
      this.lineSeparators.every((separator) => value.indexOf(separator) < 0) &&
      value.indexOf(this.cellSeparator) < 0
    ) {
      return value;
    }
    if (this.lineSeparators.length > 1) {
      value = value
        .replace(/\\/g, '\\\\')
        .replace(this.lineSeparatorRegex, '\\n');
    }
    return (
      this.stringEscapeCharacter +
      value.replace(
        new RegExp(this.stringEscapeCharacter, 'g'),
        this.doubleStringEscapeCharacter,
      ) +
      this.stringEscapeCharacter
    );
  }

  private buildMappingObject(
    key: string,
    translateObj: Record<string, string>,
    keys: string[],
  ): MapperConfiguration {
    return {
      key,
      additional: (keys || []).map((elem) => translateObj[elem]),
    };
  }

  private createTranslationKeys(): string[] {
    return [
      ...this.structure.reduce((acc, e) => {
        switch (e?.type) {
          case 'value':
          case 'values':
            acc.add(e.languageKey);
            e.additionalLanguageKeys?.forEach((key) => acc.add(key));
            break;
          case 'table':
            e.columns.forEach((col) => {
              acc.add(col.languageKey);
              col.additionalLanguageKeys?.forEach((key) => acc.add(key));
            });
            break;
        }
        return acc;
      }, new Set<string>()),
    ];
  }
}

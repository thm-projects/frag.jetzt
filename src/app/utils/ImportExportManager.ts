import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SerializedDelta } from './quill-utils';

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
      import: (config: MapperConfiguration, value: string, previous: Partial<K>) => Partial<K>;
    };
  }[];
}

export type ExportStructureItem = ExportEmptyLine | ExportItemValue<any> | ExportItemValues<any> | ExportTable<any>;

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
    this.parser = new RegExp(this.cellSeparator + '|' +
      '(' + this.stringEscapeCharacter + '[^' + this.stringEscapeCharacter + ']*' + this.stringEscapeCharacter + ')|' +
      '(' + this.lineSeparators.join('|') + '|$)', 'g');
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
    this.structure.forEach(e => {
      if (e?.type === 'table' && e.columns.length < 1) {
        throw new Error('Cant create an empty table!');
      }
    });
  }

  static createQuillMapper<T>(
    translationEmpty: string,
    access: (val: T) => SerializedDelta,
    fill: (val: string, t?: Partial<T>) => Partial<T>
  ) {
    return {
      additionalLanguageKeys: [translationEmpty],
      valueMapper: {
        export: (cfg, val) => {
          const strVal = access(val);
          return strVal ? ImportExportManager.serializeQuill(strVal) : (cfg.additional[0] || '');
        },
        import: (cfg, val: string, c?: any) =>
          fill(val === (cfg.additional[0] || '') ? '' : ImportExportManager.deserializeQuill(val), c)
      }
    };
  }

  static deserializeQuill(value: string): string {
    if (!value) {
      return '';
    }
    const unescape = (str: string) => str.replace(/{{/g, '{').replace(/}}/g, '}');
    const unescapeHard = (str: string) => str.replace(/\\}/g, '}')
      .replace(/\\{/g, '{').replace(/\\\\/g, '\\');
    const regex = /{(?=[^{])[^\\}]+((\\}|\\\\)[^\\}]*)*}/g;
    let m;
    let lastIndex = 0;
    const arr = [];
    while ((m = regex.exec(value)) !== null) {
      if (m.index > lastIndex) {
        arr.push(unescape(value.substring(lastIndex, m.index)));
      }
      lastIndex = m.index + m[0].length;
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      const last = m[0].indexOf(';');
      const content = m[0].substring(1, last);
      const num = parseInt(content, 10);
      if (num) {
        const [attr, attrStr] = this.deserializeQuillAttributes(num, last, m[0]);
        arr.push({ attributes: attr, insert: unescapeHard(attrStr) });
        continue;
      }
      const contentPayload = unescapeHard(m[0].substring(last + 1, m[0].length - 1));
      switch (content) {
        case 'i':
          arr.push({ image: contentPayload });
          break;
        case 'v':
          arr.push({ video: contentPayload });
          break;
        case 'f':
          arr.push({ formula: contentPayload });
          break;
        case 'e':
          arr.push({ emoji: contentPayload });
          break;
      }
    }
    if (lastIndex < value.length) {
      let lastStr = unescape(value.substring(lastIndex));
      if (!lastStr.endsWith('\n')) {
        lastStr += '\n';
      }
      arr.push(lastStr);
    }
    return JSON.stringify(arr);
  }

  static serializeQuill(value: string): string {
    if (!value) {
      return '';
    }
    const verify = (str: string) => str.replace(/{/g, '{{').replace(/}/g, '}}');
    const hardVerify = (str: string) => str.replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{').replace(/}/g, '\\}');
    const result = JSON.parse(value).reduce((acc, e) => {
      if (typeof e === 'string') {
        return acc + verify(e);
      } else if (typeof e['insert'] === 'string') {
        if (e.attributes) {
          return acc + '{' + this.serializeQuillAttributes(e.attributes) + hardVerify(e['insert']) + '}';
        }
        return acc + verify(e['insert']);
      } else if (e.image) {
        return acc + '{i;' + hardVerify(e.image) + '}';
      } else if (e.video) {
        return acc + '{v;' + hardVerify(e.video) + '}';
      } else if (e.formula) {
        return acc + '{f;' + hardVerify(e.formula) + '}';
      } else if (e.emoji) {
        return acc + '{e;' + hardVerify(e.emoji) + '}';
      }
      return acc;
    }, '');
    return result.endsWith('\n') ? result.substr(0, result.length - 1) : result;
  }

  private static deserializeQuillAttributes(count: number, last: number, objStr: string): [any, string] {
    const result = {};
    while (count-- > 0) {
      const start = last + 1;
      last = objStr.indexOf(';', start);
      const current = objStr.substring(start, last);
      const args = current.split('=');
      switch (args[0]) {
        case 'cb':
          result['code-block'] = true;
          break;
        case 'bq':
          result['blockquote'] = true;
          break;
        case 'l':
          if (args[1] === 'o') {
            result['list'] = 'ordered';
          } else if (args[1] === 'b') {
            result['list'] = 'bullet';
          }
          break;
        case 's':
          result['strike'] = true;
          break;
        case 'b':
          result['bold'] = true;
          break;
        case 'c':
          result['color'] = args[1];
          break;
        case 'ba':
          result['background'] = args[1];
          break;
        case 'a':
          result['link'] = args[1].replace('%3B', ';');
          break;
      }
    }
    return [result, objStr.substring(last + 1, objStr.length - 1)];
  }

  private static serializeQuillAttributes(attr: any): string {
    let result = '';
    let count = 0;
    if (attr['code-block']) {
      result += 'cb;';
      ++count;
    }
    if (attr['blockquote']) {
      result += 'bq;';
      ++count;
    }
    if (attr['list']) {
      switch (attr['list']) {
        case 'ordered':
          result += 'l=o;';
          ++count;
          break;
        case 'bullet':
          result += 'l=b;';
          ++count;
          break;
      }
    }
    if (attr['strike']) {
      result += 's;';
      ++count;
    }
    if (attr['bold']) {
      result += 'b;';
      ++count;
    }
    if (attr['color']) {
      result += 'c=' + attr['color'] + ';';
      ++count;
    }
    if (attr['background']) {
      result += 'ba=' + attr['background'] + ';';
      ++count;
    }
    if (attr['link']) {
      result += 'a=' + attr['link'].replace(';', '%3B') + ';';
      ++count;
    }
    return count + ';' + result;
  }

  exportToCSV(data: any[]): Observable<string> {
    return this.translationService.get(this.createTranslationKeys()).pipe(map(trans => {
      let index = 0;
      let result = '';
      this.structure.forEach(item => {
        if (!item) {
          result += this.cellSeparator + this.lineSeparators[0];
          return;
        }
        let key;
        let value = data[index++];
        switch (item.type) {
          case 'value':
            key = trans[item.languageKey];
            result += this.escape(key) + this.cellSeparator;
            if (item.valueMapper) {
              value = item.valueMapper.export(this.buildMappingObject(key, trans, item.additionalLanguageKeys), value);
            }
            result += this.escape(value) + this.cellSeparator + this.lineSeparators[0];
            break;
          case 'values':
            key = trans[item.languageKey];
            result += this.escape(key) + this.cellSeparator;
            if (item.valueMapper) {
              value = item.valueMapper.export(this.buildMappingObject(key, trans, item.additionalLanguageKeys), value);
            }
            result = (value as string[]).reduce((acc, e) =>
              acc + this.escape(e) + this.cellSeparator, result) + this.lineSeparators[0];
            break;
          case 'table':
            const rows = new Array(value.length).fill('');
            item.columns.forEach((col, i) => {
              key = trans[col.languageKey];
              result += this.escape(key) + this.cellSeparator;
              const mapperObj = this.buildMappingObject(key, trans, col.additionalLanguageKeys);
              value.forEach((e, j) => rows[j] += this.escape(col.valueMapper.export(mapperObj, e)) + this.cellSeparator);
            });
            result += this.lineSeparators[0] + rows.join(this.lineSeparators[0]) + this.lineSeparators[0];
            result += this.lineSeparators[0];
            break;
          default:
            console.error('Discarded data on output: ' + value);
            break;
        }
      });
      return result;
    }));
  }

  importFromCSV(str: string): Observable<any[]> {
    return this.translationService.get(this.createTranslationKeys()).pipe(map(trans => {
      const parser = new CSVParser(str, this.cellSeparator, this.lineSeparators, this.stringEscapeCharacter);
      const result = [];
      this.structure.forEach(item => {
        const line = parser.readNextLine();
        if (!item) {
          if (line.length > 1 && line[0].trim() !== '') {
            console.error('Discarded data on input: ' + line);
          }
          return;
        }
        if (line.length < 2) {
          console.error('Discarded data on input (no matching structure): ' + line);
          return;
        }
        const key = this.unescape(line[0]);
        this.readWithStructuredItemType(item, line, key, trans, parser, result);
      });
      return result;
    }));
  }

  private readWithStructuredItemType(
    item: ExportStructureItem, line: string[], key: string, translateObject: any, parser: CSVParser, result: any[]
  ) {
    let value;
    switch (item.type) {
      case 'value':
        value = this.unescape(line[1]);
        if (item.valueMapper) {
          value = item.valueMapper.import(this.buildMappingObject(key, translateObject, item.additionalLanguageKeys), value);
        }
        result.push(value);
        break;
      case 'values':
        value = line.slice(1).map(e => this.unescape(e));
        if (item.valueMapper) {
          value = item.valueMapper.import(this.buildMappingObject(key, translateObject, item.additionalLanguageKeys), value);
        }
        result.push(value);
        break;
      case 'table':
        const cols = line.map((e, i) =>
          this.buildMappingObject(this.unescape(e), translateObject, item.columns[i].additionalLanguageKeys));
        const data = [];
        let dataLine: string[];
        while ((dataLine = parser.readNextLine()) !== null) {
          if (dataLine.length < item.columns.length) {
            break;
          }
          data.push(item.columns.reduce((acc, col, i) =>
            col.valueMapper.import(cols[i], this.unescape(dataLine[i]), acc), null));
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
    if (!trimmed.startsWith(this.stringEscapeCharacter) || !trimmed.endsWith(this.stringEscapeCharacter)) {
      return value;
    }
    if (this.lineSeparators.length > 1) {
      trimmed = trimmed.replace(/\\n/g, this.lineSeparators[this.lineSeparators.length - 1])
        .replace(/\\\\/g, '\\');
    }
    return trimmed.substring(1, trimmed.length - 1)
      .replace(new RegExp(this.doubleStringEscapeCharacter, 'g'), this.stringEscapeCharacter);
  }

  private escape(value: string): string {
    value = value || '';
    if (value.indexOf(this.stringEscapeCharacter) < 0 &&
      this.lineSeparators.every(separator => value.indexOf(separator) < 0) &&
      value.indexOf(this.cellSeparator) < 0) {
      return value;
    }
    if (this.lineSeparators.length > 1) {
      value = value.replace(/\\/g, '\\\\').replace(this.lineSeparatorRegex, '\\n');
    }
    return this.stringEscapeCharacter +
      value.replace(new RegExp(this.stringEscapeCharacter, 'g'), this.doubleStringEscapeCharacter) +
      this.stringEscapeCharacter;
  }

  private buildMappingObject(key: string, translateObj: any, keys: string[]): MapperConfiguration {
    return {
      key,
      additional: (keys || []).map(elem => translateObj[elem])
    };
  }

  private createTranslationKeys(): string[] {
    return [...this.structure.reduce((acc, e) => {
      switch (e?.type) {
        case 'value':
        case 'values':
          acc.add(e.languageKey);
          e.additionalLanguageKeys?.forEach(key => acc.add(key));
          break;
        case 'table':
          e.columns.forEach(col => {
            acc.add(col.languageKey);
            col.additionalLanguageKeys?.forEach(key => acc.add(key));
          });
          break;
      }
      return acc;
    }, new Set<string>())];
  }
}

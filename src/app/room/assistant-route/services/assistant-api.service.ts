import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';

export interface DictType {
  [key: string]: ElementType;
}

export type ElementType = string | (DictType | string)[];

export interface DefaultDictType {
  [key: string]: DefaultedElementType;
}

export interface DefaultedElementType {
  type: string | (DefaultDictType | string)[];
  default: unknown;
}

interface MandatoryField {
  name: string;
  type: ElementType;
}
type MandatoryFields = (MandatoryField | MandatoryFields)[];

interface ProviderInfo {
  mandatory: MandatoryFields;
  optional: DefaultDictType;
}

@Injectable({
  providedIn: 'root',
})
export class AssistantAPIService extends BaseHttpService {
  private apiUrl = {
    base: '/ai/api',
    provider: '/provider',
  };

  constructor(private http: HttpClient) {
    super();
  }

  listProviders() {
    const url = `${this.apiUrl.base}${this.apiUrl.provider}`;
    return this.http.get<{ [provider: string]: ProviderInfo }>(url);
  }
}

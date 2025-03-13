import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { map, Observable, tap } from 'rxjs';

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

export interface MandatoryField {
  name: string;
  type: ElementType;
}
export type MandatoryFields = (MandatoryField | MandatoryFields)[];

export interface ProviderInfo {
  mandatory: MandatoryFields;
  optional: DefaultDictType;
}

export interface ProviderInfos {
  [provider: string]: ProviderInfo;
}

export interface InputProviderSetting {
  provider: string;
  json_settings: string;
  restriction_id?: UUID;
}

export class ProviderSetting {
  id: UUID;
  account_id: UUID;
  provider: string;
  json_settings: string;
  restriction_id: UUID;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    account_id,
    provider,
    json_settings,
    restriction_id,
    created_at = new Date(),
    updated_at,
  }: FieldsOf<ProviderSetting>) {
    this.id = id;
    this.account_id = account_id;
    this.provider = provider;
    this.json_settings = json_settings;
    this.restriction_id = restriction_id;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

export type PatchProviderSetting = Partial<InputProviderSetting> &
  Pick<ProviderSetting, 'id'>;

export interface InputAPISetup {
  restriction_id?: UUID;
  only_allowed_models: boolean;
  pricing_strategy: 'CHEAPEST' | 'FASTEST' | 'LARGEST' | string;
}

export class APISetup {
  id: UUID;
  account_id: UUID;
  restriction_id: UUID;
  only_allowed_models: boolean;
  pricing_strategy: string;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    account_id,
    restriction_id,
    only_allowed_models,
    pricing_strategy,
    created_at = new Date(),
    updated_at,
  }: FieldsOf<APISetup>) {
    this.id = id;
    this.account_id = account_id;
    this.restriction_id = restriction_id;
    this.only_allowed_models = only_allowed_models;
    this.pricing_strategy = pricing_strategy;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = verifyInstance(Date, updated_at);
  }
}

export type PatchAPISetup = Partial<InputAPISetup> & Pick<APISetup, 'id'>;

export class APISetupProviderSetting {
  id: UUID;
  api_provider_setting_id: UUID;
  api_setup_id: UUID;
  created_at: Date;

  constructor({
    id = null,
    api_provider_setting_id,
    api_setup_id,
    created_at = new Date(),
  }: FieldsOf<APISetupProviderSetting>) {
    this.id = id;
    this.api_provider_setting_id = api_provider_setting_id;
    this.api_setup_id = api_setup_id;
    this.created_at = verifyInstance(Date, created_at);
  }
}

export interface InputAPIModelInfo {
  model_name: string;
  provider: string;
  configurable_fields: string[];
  input_token_cost: string;
  output_token_cost: string;
  max_tokens?: number;
  max_context_length?: number;
  currency: string;
}

export class APIModelInfo {
  id: UUID;
  account_id: UUID;
  model_name: string;
  provider: string;
  configurable_fields: string[];
  input_token_cost: string;
  output_token_cost: string;
  max_tokens?: number;
  max_context_length?: number;
  currency: string;
  created_at: Date;
  updated_at: Date;

  constructor({
    id = null,
    account_id,
    model_name,
    provider,
    configurable_fields,
    input_token_cost,
    output_token_cost,
    max_tokens,
    max_context_length,
    currency,
    created_at,
    updated_at,
  }: FieldsOf<APIModelInfo>) {
    this.id = id;
    this.account_id = account_id;
    this.model_name = model_name;
    this.provider = provider;
    if (typeof configurable_fields === 'string') {
      try {
        this.configurable_fields = JSON.parse(configurable_fields);
      } catch {
        this.configurable_fields = [];
      }
    } else {
      this.configurable_fields = configurable_fields;
    }
    this.input_token_cost = input_token_cost;
    this.output_token_cost = output_token_cost;
    this.max_tokens = max_tokens;
    this.max_context_length = max_context_length;
    this.currency = currency;
    this.created_at = verifyInstance(Date, created_at);
    this.updated_at = updated_at;
  }
}

export type PatchAPIModelInfo = Partial<InputAPIModelInfo> &
  Pick<APIModelInfo, 'id'>;

export class APISetupAllowedModel {
  id: UUID;
  api_model_info_id: UUID;
  api_setup_id: UUID;
  created_at: Date;

  constructor({
    id = null,
    api_model_info_id,
    api_setup_id,
    created_at = new Date(),
  }: FieldsOf<APISetupAllowedModel>) {
    this.id = id;
    this.api_model_info_id = api_model_info_id;
    this.api_setup_id = api_setup_id;
    this.created_at = verifyInstance(Date, created_at);
  }
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class AssistantAPIService extends BaseHttpService {
  private apiUrl = {
    base: '/ai/api',
    provider: '/provider',
    providerSetting: '/provider-setting',
    setup: '/setup',
    model: '/model',
    allowedModel: '/allowed-model',
    admin: '/admin',
  };

  constructor(private http: HttpClient) {
    super();
  }

  listProviders() {
    const url = `${this.apiUrl.base}${this.apiUrl.provider}`;
    return this.http.get<ProviderInfos>(url);
  }

  createSetting(
    provider_setting: InputProviderSetting,
  ): Observable<ProviderSetting> {
    const url = `${this.apiUrl.base}${this.apiUrl.providerSetting}`;
    return this.http
      .post<ProviderSetting>(
        url,
        {
          provider_setting,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setting) => verifyInstance(ProviderSetting, setting)),
      );
  }

  listSettings(): Observable<ProviderSetting[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.providerSetting}`;
    return this.http.get<ProviderSetting[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((settings) =>
        settings.map((setting) => verifyInstance(ProviderSetting, setting)),
      ),
    );
  }

  patchSetting(patch: PatchProviderSetting): Observable<ProviderSetting> {
    const url = `${this.apiUrl.base}${this.apiUrl.providerSetting}/${patch.id}`;
    return this.http
      .patch<ProviderSetting>(
        url,
        {
          provider_setting: patch,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setting) => verifyInstance(ProviderSetting, setting)),
      );
  }

  deleteSetting(setting_id: ProviderSetting['id']): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.providerSetting}/${setting_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  createSetup(setup: InputAPISetup): Observable<APISetup> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}`;
    return this.http
      .post<APISetup>(
        url,
        {
          setup,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setup) => verifyInstance(APISetup, setup)),
      );
  }

  listSetups(): Observable<APISetup[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}`;
    return this.http.get<APISetup[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((setups) => setups.map((setup) => verifyInstance(APISetup, setup))),
    );
  }

  patchSetup(patch: PatchAPISetup): Observable<APISetup> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${patch.id}`;
    return this.http
      .patch<APISetup>(
        url,
        {
          setup: patch,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setup) => verifyInstance(APISetup, setup)),
      );
  }

  deleteSetup(setup_id: APISetup['id']): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${setup_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  linkProviderToSetup(
    setup_id: APISetup['id'],
    setting_id: ProviderSetting['id'],
  ): Observable<APISetupProviderSetting> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${setup_id}${this.apiUrl.providerSetting}/${setting_id}`;
    return this.http.post(url, null, httpOptions).pipe(
      tap(() => ''),
      map((link) => verifyInstance(APISetupProviderSetting, link)),
    );
  }

  unlinkProviderFromSetup(
    setup_id: APISetup['id'],
    setting_id: ProviderSetting['id'],
  ): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${setup_id}${this.apiUrl.providerSetting}/${setting_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  listSetupProviderLinks(
    setup_id: APISetup['id'],
  ): Observable<APISetupProviderSetting[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${setup_id}${this.apiUrl.providerSetting}`;
    return this.http.get<APISetupProviderSetting[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((links) =>
        links.map((link) => verifyInstance(APISetupProviderSetting, link)),
      ),
    );
  }

  createModelInfo(model: InputAPIModelInfo): Observable<APIModelInfo> {
    const configurable_fields = JSON.stringify(model.configurable_fields);
    const url = `${this.apiUrl.base}${this.apiUrl.model}`;
    return this.http
      .post<APIModelInfo>(
        url,
        {
          model: {
            ...model,
            configurable_fields,
          },
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((info) => verifyInstance(APIModelInfo, info)),
      );
  }

  listModelInfos(): Observable<APIModelInfo[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.model}`;
    return this.http.get<APIModelInfo[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((infos) => infos.map((info) => verifyInstance(APIModelInfo, info))),
    );
  }

  patchModelInfo(patch: PatchAPIModelInfo): Observable<APIModelInfo> {
    const model = { ...patch } as object;
    if ('configurable_fields' in patch) {
      model['configurable_fields'] = JSON.stringify(patch.configurable_fields);
    }
    const url = `${this.apiUrl.base}${this.apiUrl.model}/${patch.id}`;
    return this.http
      .patch(
        url,
        {
          model,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((info) => verifyInstance(APIModelInfo, info)),
      );
  }

  deleteModelInfo(modelId: APIModelInfo['id']): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.model}/${modelId}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  linkModelInfoToSetup(
    setup_id: APISetup['id'],
    model_id: APIModelInfo['id'],
  ): Observable<APISetupAllowedModel> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${setup_id}${this.apiUrl.allowedModel}/${model_id}`;
    return this.http.post<APISetupAllowedModel>(url, null, httpOptions).pipe(
      tap(() => ''),
      map((model) => verifyInstance(APISetupAllowedModel, model)),
    );
  }

  unlinkModelInfoFromSetup(
    setup_id: APISetup['id'],
    model_id: APIModelInfo['id'],
  ): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${setup_id}${this.apiUrl.allowedModel}/${model_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  listSetupAllowedModels(
    setup_id: APISetup['id'],
  ): Observable<APISetupAllowedModel[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.setup}/${setup_id}${this.apiUrl.allowedModel}`;
    return this.http.get<APISetupAllowedModel[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((models) =>
        models.map((model) => verifyInstance(APISetupAllowedModel, model)),
      ),
    );
  }

  createAdminSetting(
    provider_setting: InputProviderSetting,
  ): Observable<ProviderSetting> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.providerSetting}`;
    return this.http
      .post<ProviderSetting>(
        url,
        {
          provider_setting,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setting) => verifyInstance(ProviderSetting, setting)),
      );
  }

  listAdminSettings(): Observable<ProviderSetting[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.providerSetting}`;
    return this.http.get<ProviderSetting[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((settings) =>
        settings.map((setting) => verifyInstance(ProviderSetting, setting)),
      ),
    );
  }

  patchAdminSetting(patch: PatchProviderSetting): Observable<ProviderSetting> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.providerSetting}/${patch.id}`;
    return this.http
      .patch<ProviderSetting>(
        url,
        {
          provider_setting: patch,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setting) => verifyInstance(ProviderSetting, setting)),
      );
  }

  deleteAdminSetting(setting_id: ProviderSetting['id']): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.providerSetting}/${setting_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  createAdminSetup(setup: InputAPISetup): Observable<APISetup> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}`;
    return this.http
      .post<APISetup>(
        url,
        {
          setup,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setup) => verifyInstance(APISetup, setup)),
      );
  }

  listAdminSetups(): Observable<APISetup[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}`;
    return this.http.get<APISetup[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((setups) => setups.map((setup) => verifyInstance(APISetup, setup))),
    );
  }

  patchAdminSetup(patch: PatchAPISetup): Observable<APISetup> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${patch.id}`;
    return this.http
      .patch<APISetup>(
        url,
        {
          setup: patch,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((setup) => verifyInstance(APISetup, setup)),
      );
  }

  deleteAdminSetup(setup_id: APISetup['id']): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${setup_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  linkAdminProviderToSetup(
    setup_id: APISetup['id'],
    setting_id: ProviderSetting['id'],
  ): Observable<APISetupProviderSetting> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${setup_id}${this.apiUrl.providerSetting}/${setting_id}`;
    return this.http.post(url, null, httpOptions).pipe(
      tap(() => ''),
      map((link) => verifyInstance(APISetupProviderSetting, link)),
    );
  }

  unlinkAdminProviderFromSetup(
    setup_id: APISetup['id'],
    setting_id: ProviderSetting['id'],
  ): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${setup_id}${this.apiUrl.providerSetting}/${setting_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  listAdminSetupProviderLinks(
    setup_id: APISetup['id'],
  ): Observable<APISetupProviderSetting[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${setup_id}${this.apiUrl.providerSetting}`;
    return this.http.get<APISetupProviderSetting[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((links) =>
        links.map((link) => verifyInstance(APISetupProviderSetting, link)),
      ),
    );
  }

  createAdminModelInfo(model: InputAPIModelInfo): Observable<APIModelInfo> {
    const configurable_fields = JSON.stringify(model.configurable_fields);
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.model}`;
    return this.http
      .post<APIModelInfo>(
        url,
        {
          model: {
            ...model,
            configurable_fields,
          },
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((info) => verifyInstance(APIModelInfo, info)),
      );
  }

  listAdminModelInfos(): Observable<APIModelInfo[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.model}`;
    return this.http.get<APIModelInfo[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((infos) => infos.map((info) => verifyInstance(APIModelInfo, info))),
    );
  }

  patchAdminModelInfo(patch: PatchAPIModelInfo): Observable<APIModelInfo> {
    const model = { ...patch } as object;
    if ('configurable_fields' in patch) {
      model['configurable_fields'] = JSON.stringify(patch.configurable_fields);
    }
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.model}/${patch.id}`;
    return this.http
      .patch(
        url,
        {
          model,
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((info) => verifyInstance(APIModelInfo, info)),
      );
  }

  deleteAdminModelInfo(modelId: APIModelInfo['id']): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.model}/${modelId}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  linkAdminModelInfoToSetup(
    setup_id: APISetup['id'],
    model_id: APIModelInfo['id'],
  ): Observable<APISetupAllowedModel> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${setup_id}${this.apiUrl.allowedModel}/${model_id}`;
    return this.http.post<APISetupAllowedModel>(url, null, httpOptions).pipe(
      tap(() => ''),
      map((model) => verifyInstance(APISetupAllowedModel, model)),
    );
  }

  unlinkAdminModelInfoFromSetup(
    setup_id: APISetup['id'],
    model_id: APIModelInfo['id'],
  ): Observable<void> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${setup_id}${this.apiUrl.allowedModel}/${model_id}`;
    return this.http.delete<void>(url, httpOptions).pipe(tap(() => ''));
  }

  listAdminSetupAllowedModels(
    setup_id: APISetup['id'],
  ): Observable<APISetupAllowedModel[]> {
    const url = `${this.apiUrl.base}${this.apiUrl.admin}${this.apiUrl.setup}/${setup_id}${this.apiUrl.allowedModel}`;
    return this.http.get<APISetupAllowedModel[]>(url, httpOptions).pipe(
      tap(() => ''),
      map((models) =>
        models.map((model) => verifyInstance(APISetupAllowedModel, model)),
      ),
    );
  }
}

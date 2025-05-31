import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseHttpService } from 'app/services/http/base-http.service';
import { Observable } from 'rxjs';

const apiUrl = {
  base: '/ai/model',
  list: '/list',
  provider: '/provider',
  evict: '/evict',
};

export interface Model {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    is_moderated: boolean;
    context_length?: number;
    max_completion_tokens?: number;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
    input_cache_read: string;
    input_cache_write: string;
    web_search: string;
    internal_reasoning: string;
  };
  context_length?: number;
  hugging_face_id?: string;
  per_request_limits?: { [key: string]: unknown };
  supported_parameters?: string[];
}

export interface Provider {
  name: string;
  context_length: number;
  pricing: {
    request: string;
    image: string;
    prompt: string;
    completion: string;
  };
  provider_name: string;
  supported_parameters: string[];
  quantization?: string;
  max_completion_tokens?: number;
  max_prompt_tokens?: number;
  status?: string;
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class ListModelService extends BaseHttpService {
  private client = inject(HttpClient);

  listModels(): Observable<Model[]> {
    const url = `${apiUrl.base}${apiUrl.list}`;
    return this.client.get<Model[]>(url, httpOptions);
  }

  getProviders(modelId: string) {
    const url = `${apiUrl.base}${apiUrl.provider}/${modelId}`;
    return this.client.get<Provider[]>(url, httpOptions);
  }

  evictCache(): Observable<{ message: string }> {
    const url = `${apiUrl.base}${apiUrl.evict}`;
    return this.client.post<{ message: string }>(url, {}, httpOptions);
  }
}

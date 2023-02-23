import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GPTEncoder } from 'app/gpt-encoder/GPTEncoder';
import { forkJoin, Observable, ReplaySubject, take } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

const httpOptionsPlain = {
  headers: new HttpHeaders({ 'Content-Type': 'text' }),
  responseType: 'text',
} as const;

@Injectable({
  providedIn: 'root',
})
export class GptEncoderService {
  private gptEncoder = new ReplaySubject<GPTEncoder>(1);

  constructor(private httpClient: HttpClient) {
    forkJoin([
      this.httpClient.get<object>(
        '/assets/config/gpt/encoder.json',
        httpOptions,
      ),
      this.httpClient.get(
        '/assets/config/gpt/vocab.bpe',
        httpOptionsPlain,
      ),
    ]).subscribe({
      next: ([encoder, bpeData]) => {
        this.gptEncoder.next(new GPTEncoder(encoder, bpeData));
      },
      error: (e) => {
        console.error(e);
      },
    });
  }

  public getEncoderOnce(): Observable<GPTEncoder> {
    return this.gptEncoder.pipe(take(1));
  }
}

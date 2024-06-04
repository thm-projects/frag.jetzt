import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';

export class ServerSentEvent {
  constructor(
    public readonly id: string,
    public readonly event: string,
    public readonly data: string,
    public readonly retry: string,
  ) {}

  public jsonData(): unknown {
    return JSON.parse(this.data);
  }
}

export const postSSE = (
  httpClient: HttpClient,
  url: string,
  body: unknown,
): Observable<ServerSentEvent> => {
  const request = new HttpRequest('POST', url, body, {
    reportProgress: true,
    responseType: 'text',
  });
  let lastSize = 0;
  let remainingString = '';
  return httpClient.request(request).pipe(
    switchMap((event) => {
      if (event.type === HttpEventType.DownloadProgress) {
        const text = event['partialText'] as string;
        if (!text) {
          return of();
        }
        remainingString += text.slice(lastSize);
        lastSize = text.length;
        return extractData(remainingString, (s) => (remainingString = s));
      } else if (event.type === HttpEventType.Response) {
        const text = event.body as string;
        remainingString += text.slice(lastSize);
        return extractData(remainingString, (s) => (remainingString = s));
      }
      return of();
    }),
  );
};

const extractData = (
  data: string,
  updater: (str: string) => void,
): Observable<ServerSentEvent> => {
  let lastIndex = 0;
  let currentIndex = 0;
  const resultArr: ServerSentEvent[] = [];
  while ((currentIndex = data.indexOf('\n\n', lastIndex)) >= 0) {
    let id = null;
    let event = null;
    let sseData = null;
    let retry = null;
    const subData = data.slice(lastIndex, currentIndex);
    subData.split('\n').forEach((line: string) => {
      const start = line.indexOf(':');
      if (start < 0) {
        console.error(
          'Unknown SSE Entry: ' +
            JSON.stringify(line) +
            ' from ' +
            JSON.stringify(subData),
        );
        return;
      }
      const entryData = line.substring(start + 1);
      switch (line.substring(0, start).toLowerCase()) {
        case 'id':
          id = (id != null ? id + '\n' : '') + entryData;
          break;
        case 'event':
          event = (event != null ? event + '\n' : '') + entryData;
          break;
        case 'data':
          sseData = (sseData != null ? sseData + '\n' : '') + entryData;
          break;
        case 'retry':
          retry = (retry != null ? retry + '\n' : '') + entryData;
          break;
        default:
          console.error('Unknown SSE value ' + JSON.stringify(line));
      }
    });
    if (id != null || event != null || sseData != null || retry != null) {
      resultArr.push(new ServerSentEvent(id, event, sseData, retry));
    }
    lastIndex = currentIndex + 2;
  }
  if (lastIndex > 0) {
    updater(data.slice(lastIndex));
  }
  return of(...resultArr);
};

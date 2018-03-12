import { Injectable } from '@angular/core';
import { Content } from './content';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { ErrorHandlingService } from './error-handling.service';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class ContentService extends ErrorHandlingService {

  private contentUrl = 'api/contents';

  constructor(private http: HttpClient) {
    super();
  }

  getContents(): Observable<Content[]> {
    return this.http.get<Content[]>(this.contentUrl).pipe(
      catchError(this.handleError('getContents', []))
    );
  }

  addContent(content: Content): Observable<Content> {
    return this.http.post<Content>(this.contentUrl, content, httpOptions).pipe(
      catchError(this.handleError<Content>('addContent'))
    );
  }

  getContent(id: string): Observable<Content> {
    const url = `${this.contentUrl}/${id}`;
    return this.http.get<Content>(url).pipe(
      catchError(this.handleError<Content>(`getContent id=${id}`))
    );
  }
}

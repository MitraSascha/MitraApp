import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.production
    ? environment.apiUrl
    : window.location.protocol === 'https:'
      ? '/api'                                          // HTTPS-Proxy (port 4443)
      : `http://${window.location.hostname}:8000/api`; // direkter Dev-Server (port 4200)

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: Partial<unknown>): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }

  uploadFile<T>(path: string, file: File, extraFields?: Record<string, string>): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
    }
    return this.http.post<T>(`${this.baseUrl}${path}`, formData);
  }

  uploadFiles<T>(path: string, files: Record<string, File>): Observable<T> {
    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => formData.append(key, file));
    return this.http.post<T>(`${this.baseUrl}${path}`, formData);
  }

  streamSSE(path: string, body: unknown): Observable<string> {
    return new Observable<string>(observer => {
      fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('mitra_access') ?? ''}`,
        },
        body: JSON.stringify(body),
      }).then(async response => {
        if (!response.ok || !response.body) {
          observer.error(new Error(`SSE-Fehler: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          observer.next(decoder.decode(value, { stream: true }));
        }
        observer.complete();
      }).catch(err => observer.error(err));
    });
  }
}

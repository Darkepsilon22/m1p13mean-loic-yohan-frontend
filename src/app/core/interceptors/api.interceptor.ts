import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let url = request.url;
    if (!url.startsWith('http')) {
      url = environment.apiUrl.replace(/\/$/, '') + (request.url.startsWith('/') ? request.url : '/' + request.url);
    }
    let headers = request.headers;
    const token = this.auth.getToken();
    if (token) {
      headers = headers.set('Authorization', 'Bearer ' + token);
    }
    const req = request.clone({ url, headers });
    return next.handle(req);
  }
}

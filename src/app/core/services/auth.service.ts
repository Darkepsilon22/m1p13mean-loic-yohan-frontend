import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'boutique' | 'acheteur';
  phone?: string;
  adminSecretKey?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: { user: { id: string; email: string; firstName: string; lastName: string; role: string } };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    otpRequired: boolean;
  };
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
    token: string;
  };
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getStoredUser(): any {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  setStoredUser(user: any): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  register(body: RegisterBody): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, body).pipe(
      catchError(this.handleError)
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, { email, password }).pipe(
      catchError(this.handleError)
    );
  }

  verifyOtp(email: string, otp: string): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.base}/auth/verify-otp`, { email, otp }).pipe(
      tap(res => {
        if (res.success && res.data?.token) {
          this.setToken(res.data.token);
          if (res.data.user) {
            this.setStoredUser(res.data.user);
          }
        }
      }),
      catchError(this.handleError)
    );
  }

  resendOtp(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.base}/auth/resend-otp`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  verifyEmail(token: string): Observable<{ success: boolean; message: string; data?: { user: any; token: string } }> {
    return this.http.get<{ success: boolean; message: string; data?: { user: any; token: string } }>(
      `${this.base}/auth/verify-email/${token}`
    ).pipe(
      tap(res => {
        if (res.success && res.data?.token) {
          this.setToken(res.data.token);
          if (res.data.user) {
            this.setStoredUser(res.data.user);
          }
        }
      }),
      catchError(this.handleError)
    );
  }

  getMe(): Observable<{ success: boolean; data: { user: any } }> {
    return this.http.get<{ success: boolean; data: { user: any } }>(`${this.base}/auth/me`).pipe(
      tap(res => {
        if (res.success && res.data?.user) {
          this.setStoredUser(res.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError = (err: any): Observable<never> => {
    if (err.error && typeof err.error === 'object' && 'message' in err.error) {
      return throwError(() => err.error as ApiErrorBody);
    }
    const msg = err.message || 'Erreur réseau. Veuillez réessayer.';
    return throwError(() => ({ success: false, message: msg, errors: [] } as ApiErrorBody));
  };
}

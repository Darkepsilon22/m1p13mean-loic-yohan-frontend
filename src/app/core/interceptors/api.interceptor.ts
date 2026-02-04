import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

function translateMessageToFr(message: string): string {
  if (!message) return message;

  const direct: Record<string, string> = {
    'Validation failed': 'Validation échouée',
    'Email already registered': 'Email déjà utilisé.',
    'Invalid or expired verification token': 'Lien de vérification invalide ou expiré.',
    'No account found with this email': 'Aucun compte trouvé avec cet email.',
    'Email is already verified': 'Email déjà vérifié.',
    'Invalid email or password': 'Email ou mot de passe incorrect.',
    'Please verify your email before logging in': 'Veuillez vérifier votre email avant de vous connecter.',
    'Please verify your email first': 'Veuillez d’abord vérifier votre email.',
    'Your account has been deactivated. Please contact administrator.': 'Votre compte est désactivé. Veuillez contacter un administrateur.',
    'Your account is pending approval. Please wait for admin validation.': 'Votre compte est en attente de validation. Veuillez attendre la validation de l’administrateur.',
    'Your account has been blocked. Please contact administrator.': 'Votre compte a été bloqué. Veuillez contacter un administrateur.',
    'Account locked due to too many failed attempts. Try again in 15 minutes.': 'Compte verrouillé après trop de tentatives. Réessayez dans 15 minutes.',
    'Failed to send OTP. Please try again.': 'Impossible d’envoyer le code OTP. Veuillez réessayer.',
    'User not found': 'Utilisateur introuvable.',
    'No OTP requested. Please login again.': 'Aucune demande de code OTP. Veuillez vous reconnecter.',
    'Too many failed attempts. Please login again.': 'Trop de tentatives échouées. Veuillez vous reconnecter.',
    'Current password is incorrect': 'Mot de passe actuel incorrect.',
    'Boutique already in favorites': 'Boutique déjà dans les favoris.',
    'Boutique not in favorites': 'Boutique absente des favoris.'
  };
  if (direct[message]) return direct[message];

  // Dynamic patterns
  const lockedIn = message.match(/^Account is locked\. Try again in (\d+) minutes?\.$/);
  if (lockedIn) return `Compte verrouillé. Réessayez dans ${lockedIn[1]} minute(s).`;

  const attemptsLeftLogin = message.match(/^Invalid email or password\. (\d+) attempts remaining\.$/);
  if (attemptsLeftLogin) return `Email ou mot de passe incorrect. Il vous reste ${attemptsLeftLogin[1]} tentative(s).`;

  const attemptsLeftOtp = message.match(/^Invalid or expired OTP\. (\d+) attempts remaining\.$/);
  if (attemptsLeftOtp) return `Code OTP invalide ou expiré. Il vous reste ${attemptsLeftOtp[1]} tentative(s).`;

  const invalidStatus = message.match(/^Invalid status\. Must be one of:\s*(.+)$/);
  if (invalidStatus) return `Statut invalide. Valeurs possibles : ${invalidStatus[1]}`;

  return message;
}

function translateErrorBodyToFr(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const out = { ...body };
  if (typeof out.message === 'string') {
    out.message = translateMessageToFr(out.message);
  }
  if (Array.isArray(out.errors)) {
    out.errors = out.errors.map((e: any) => ({
      ...e,
      message: typeof e?.message === 'string' ? translateMessageToFr(e.message) : e?.message
    }));
  }
  return out;
}

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
    return next.handle(req).pipe(
      catchError((err: any) => {
        // Translate API error messages to French (frontend only)
        if (err instanceof HttpErrorResponse) {
          const translated = translateErrorBodyToFr(err.error);
          return throwError(() => new HttpErrorResponse({ ...err, error: translated }));
        }
        return throwError(() => err);
      })
    );
  }
}

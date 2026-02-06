import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface StripeCheckoutResponse {
  success: boolean;
  data: {
    sessionId: string;
    url: string;
  };
}

export interface StripeVerifyResponse {
  success: boolean;
  data: {
    payment: {
      reference: string;
      status: string;
      amount: number;
      currency: string;
    };
    order: {
      orderReference: string;
      status: string;
      paymentStatus: string;
      totalAmount: number;
    } | null;
    stripeStatus: string;
  };
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  /** Crée une session Stripe Checkout et retourne l'URL de redirection */
  createStripeCheckout(orderId: string): Observable<{ sessionId: string; url: string }> {
    return this.http.post<StripeCheckoutResponse>(`${API}/payments/stripe/create-checkout-session`, { orderId }).pipe(
      map(res => res.data),
      catchError(handleError)
    );
  }

  /** Vérifie le statut du paiement Stripe après le retour */
  verifyStripePayment(sessionId: string): Observable<StripeVerifyResponse['data']> {
    return this.http.get<StripeVerifyResponse>(`${API}/payments/stripe/verify/${sessionId}`).pipe(
      map(res => res.data),
      catchError(handleError)
    );
  }
}

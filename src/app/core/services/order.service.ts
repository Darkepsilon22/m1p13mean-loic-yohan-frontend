import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiErrorBody } from './auth.service';

const API = environment.apiUrl;

export interface OrderItem {
  productId: string;
  boutiqueId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

export interface Order {
  _id: string;
  orderReference: string;
  userId: string;
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
  paymentMethod: 'mvola' | 'orange' | 'airtel' | 'card' | 'cash' | 'stripe' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderBody {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod?: string;
  notes?: string;
}

export interface OrderListParams {
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination?: { page: number; limit: number; total: number; pages: number };
}

export interface OrderResponse {
  success: boolean;
  data: { order: Order } & Partial<Order>;
  message?: string;
}

function handleError(err: any): Observable<never> {
  if (err.error && typeof err.error === 'object' && 'message' in err.error) {
    return throwError(() => err.error as ApiErrorBody);
  }
  return throwError(() => ({ success: false, message: err.message || 'Erreur réseau', errors: [] } as ApiErrorBody));
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  /** Crée une commande à partir du panier */
  createOrder(body: CreateOrderBody): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${API}/orders`, body).pipe(catchError(handleError));
  }

  /** Liste des commandes de l'utilisateur */
  getMyOrders(params?: OrderListParams): Observable<OrdersResponse> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<OrdersResponse>(`${API}/orders/my-orders${query}`).pipe(catchError(handleError));
  }

  /** Récupère une commande par ID */
  getById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${API}/orders/${id}`).pipe(catchError(handleError));
  }

  /** Récupère une commande par référence */
  getByReference(reference: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${API}/orders/reference/${reference}`).pipe(catchError(handleError));
  }

  /** Annule une commande */
  cancelOrder(id: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${API}/orders/${id}/cancel`, {}).pipe(catchError(handleError));
  }

  /** Boutique: liste des commandes contenant mes produits */
  getBoutiqueOrders(params?: OrderListParams): Observable<OrdersResponse> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.paymentStatus) q.set('paymentStatus', params.paymentStatus);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<OrdersResponse>(`${API}/orders/boutique${query}`).pipe(catchError(handleError));
  }

  /** Boutique: détail d'une commande */
  getBoutiqueOrderById(id: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${API}/orders/boutique/${id}`).pipe(catchError(handleError));
  }

  /** Boutique: statistiques des commandes */
  getBoutiqueStats(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/orders/boutique/stats`).pipe(catchError(handleError));
  }

  /** Boutique: met à jour le statut d'une commande */
  boutiqueUpdateOrderStatus(id: string, status: string, trackingInfo?: { trackingNumber?: string; carrier?: string }): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${API}/orders/boutique/${id}/status`, { status, ...trackingInfo }).pipe(catchError(handleError));
  }

  /** Acheteur: confirme la réception d'une commande */
  confirmReception(id: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${API}/orders/${id}/confirm-reception`, {}).pipe(catchError(handleError));
  }

  /** Admin: toutes les commandes */
  adminGetAll(params?: OrderListParams): Observable<OrdersResponse> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.page != null) q.set('page', String(params.page));
    if (params?.limit != null) q.set('limit', String(params.limit));
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get<OrdersResponse>(`${API}/orders/admin${query}`).pipe(catchError(handleError));
  }

  /** Admin: statistiques globales */
  adminGetStats(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${API}/orders/admin/stats`).pipe(catchError(handleError));
  }

  /** Admin: change le statut d'une commande */
  adminUpdateStatus(id: string, status: string): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${API}/orders/admin/${id}/status`, { status }).pipe(catchError(handleError));
  }

  /** Export PDF des commandes de l'utilisateur */
  exportMyOrdersPDF(params?: { status?: string; startDate?: string; endDate?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get(`${API}/orders/my-orders/export/pdf${query}`, { responseType: 'blob' });
  }

  /** Export Excel des commandes de l'utilisateur */
  exportMyOrdersExcel(params?: { status?: string; startDate?: string; endDate?: string }): Observable<Blob> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    const query = q.toString() ? '?' + q.toString() : '';
    return this.http.get(`${API}/orders/my-orders/export/excel${query}`, { responseType: 'blob' });
  }

  /** Obtenir le libellé du statut */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée',
      refunded: 'Remboursée'
    };
    return labels[status] || status;
  }

  /** Obtenir le libellé du statut de paiement */
  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      success: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé'
    };
    return labels[status] || status;
  }
}

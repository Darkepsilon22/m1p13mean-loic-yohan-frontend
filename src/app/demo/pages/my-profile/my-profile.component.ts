import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, ApiErrorBody } from '../../../core/services/auth.service';
import { OrderService, Order } from '../../../core/services/order.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit {
  // Profile
  form: FormGroup;
  currentUser: any = null;
  loading = false;
  successMessage = '';
  errorMessage = '';
  fieldErrors: Record<string, string> = {};

  // Orders (5 dernières uniquement)
  orders: Order[] = [];
  loadingOrders = false;
  orderError = '';
  totalOrders = 0;
  expandedOrderId: string | null = null;

  // Confirm reception
  confirmingOrderId: string | null = null;
  receptionSuccess: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    public orderService: OrderService
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      phone: [''],
      avatar: ['']
    });
  }

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: () => this.loadUserData(),
      error: () => this.loadUserData()
    });
    this.loadOrders();
  }

  loadUserData(): void {
    this.currentUser = this.auth.getStoredUser();
    if (this.currentUser) {
      this.form.patchValue({
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        phone: this.currentUser.phone || '',
        avatar: this.currentUser.avatar || ''
      });
    }
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (this.fieldErrors[field]) return this.fieldErrors[field];
    if (control?.invalid && control?.touched && control.errors) {
      if (control.errors['required']) return 'Requis';
      if (control.errors['maxlength']) return 'Max. 50 caractères';
    }
    return '';
  }

  onSubmitProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.fieldErrors = {};
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const body: any = {
      firstName: v.firstName?.trim() || undefined,
      lastName: v.lastName?.trim() || undefined,
      phone: v.phone?.trim() || undefined,
      avatar: v.avatar?.trim() || undefined
    };
    if (!body.avatar) delete body.avatar;
    this.loading = true;
    this.auth.updateProfile(body).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Profil mis à jour avec succès.';
        this.loadUserData();
      },
      error: (err: ApiErrorBody) => {
        this.loading = false;
        this.errorMessage = err.message || 'Erreur lors de la mise à jour.';
        if (err.errors?.length) {
          err.errors.forEach(e => { this.fieldErrors[e.field] = e.message; });
        }
      }
    });
  }

  // --- Orders (5 dernières) ---

  loadOrders(): void {
    this.loadingOrders = true;
    this.orderError = '';
    this.orderService.getMyOrders({ page: 1, limit: 5 }).subscribe({
      next: (res: any) => {
        this.orders = res.data?.orders ?? res.data ?? [];
        this.totalOrders = res.data?.pagination?.total ?? res.pagination?.total ?? 0;
        this.loadingOrders = false;
      },
      error: (err: ApiErrorBody) => {
        this.loadingOrders = false;
        this.orderError = err.message || 'Erreur lors du chargement des commandes.';
      }
    });
  }

  toggleOrderDetail(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getItemsCount(order: Order): number {
    return order.items ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-primary',
      shipped: 'badge-info',
      delivered: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-secondary'
    };
    return map[status] || 'badge-secondary';
  }

  getPaymentClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      processing: 'badge-info',
      success: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-secondary'
    };
    return map[status] || 'badge-secondary';
  }

  // --- Confirm reception ---

  confirmReception(order: Order): void {
    this.confirmingOrderId = order._id;
    this.receptionSuccess = null;
    this.orderService.confirmReception(order._id).subscribe({
      next: () => {
        this.confirmingOrderId = null;
        this.receptionSuccess = order._id;
        order.status = 'completed';
        setTimeout(() => this.receptionSuccess = null, 4000);
      },
      error: (err: ApiErrorBody) => {
        this.confirmingOrderId = null;
        this.orderError = err.message || 'Erreur lors de la confirmation.';
      }
    });
  }
}

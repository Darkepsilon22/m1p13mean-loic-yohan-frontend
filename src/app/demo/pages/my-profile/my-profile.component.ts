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

  // Orders
  orders: Order[] = [];
  loadingOrders = false;
  orderError = '';
  statusFilter = '';
  pagination = { page: 1, limit: 10, total: 0, pages: 0 };
  expandedOrderId: string | null = null;

  // Export
  exporting = false;

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

  // --- Orders ---

  loadOrders(): void {
    this.loadingOrders = true;
    this.orderError = '';
    this.orderService.getMyOrders({
      status: this.statusFilter || undefined,
      page: this.pagination.page,
      limit: this.pagination.limit
    }).subscribe({
      next: (res: any) => {
        this.orders = res.data?.orders ?? res.data ?? [];
        this.pagination = res.data?.pagination ?? res.pagination ?? this.pagination;
        this.loadingOrders = false;
      },
      error: (err: ApiErrorBody) => {
        this.loadingOrders = false;
        this.orderError = err.message || 'Erreur lors du chargement des commandes.';
      }
    });
  }

  onStatusFilterChange(): void {
    this.pagination.page = 1;
    this.loadOrders();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.pages) return;
    this.pagination.page = p;
    this.loadOrders();
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

  // --- Export ---

  exportPDF(): void {
    this.exporting = true;
    this.orderService.exportMyOrdersPDF(this.statusFilter || undefined).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `historique-achats-${Date.now()}.pdf`);
        this.exporting = false;
      },
      error: () => {
        this.orderError = 'Erreur lors de l\'export PDF.';
        this.exporting = false;
      }
    });
  }

  exportExcel(): void {
    this.exporting = true;
    this.orderService.exportMyOrdersExcel(this.statusFilter || undefined).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `historique-achats-${Date.now()}.xlsx`);
        this.exporting = false;
      },
      error: () => {
        this.orderError = 'Erreur lors de l\'export Excel.';
        this.exporting = false;
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

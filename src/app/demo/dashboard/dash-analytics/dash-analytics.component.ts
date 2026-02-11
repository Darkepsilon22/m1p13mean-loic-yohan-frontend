import { Component, OnInit, OnDestroy } from '@angular/core';
import { StatsService } from '../../../core/services/stats.service';
import ApexCharts from 'apexcharts/dist/apexcharts.common.js';

@Component({
  selector: 'app-dash-analytics',
  templateUrl: './dash-analytics.component.html',
  styleUrls: ['./dash-analytics.component.scss']
})
export class DashAnalyticsComponent implements OnInit, OnDestroy {

  loading = true;
  errorMessage = '';

  // Rental dashboard data
  rental: any = null;

  // Users list
  users: any[] = [];
  usersPagination: any = { page: 1, limit: 10, total: 0, pages: 0 };
  usersSearch = '';
  usersRoleFilter = '';

  // Charts
  private monthlyRevenueChart: any = null;
  private revenueByZoneBarChart: any = null;
  private revenueByZoneDonutChart: any = null;

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    if (this.monthlyRevenueChart) { this.monthlyRevenueChart.destroy(); this.monthlyRevenueChart = null; }
    if (this.revenueByZoneBarChart) { this.revenueByZoneBarChart.destroy(); this.revenueByZoneBarChart = null; }
    if (this.revenueByZoneDonutChart) { this.revenueByZoneDonutChart.destroy(); this.revenueByZoneDonutChart = null; }
  }

  loadAllData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.statsService.getAdminRentalDashboard().subscribe({
      next: (res) => {
        this.rental = res.data;
        this.loading = false;
        setTimeout(() => this.initCharts(), 200);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors du chargement.';
        this.loading = false;
      }
    });

    this.loadUsers();
  }

  loadUsers(): void {
    const params: any = {
      page: this.usersPagination.page,
      limit: this.usersPagination.limit
    };
    if (this.usersRoleFilter) params.role = this.usersRoleFilter;
    if (this.usersSearch) params.search = this.usersSearch;

    this.statsService.getAllUsers(params).subscribe({
      next: (res) => {
        this.users = res.data?.users ?? [];
        this.usersPagination = res.data?.pagination ?? this.usersPagination;
      },
      error: () => {}
    });
  }

  onUsersFilterChange(): void {
    this.usersPagination.page = 1;
    this.loadUsers();
  }

  goToUsersPage(p: number): void {
    if (p < 1 || p > this.usersPagination.pages) return;
    this.usersPagination.page = p;
    this.loadUsers();
  }

  // ===== Charts =====

  private initCharts(): void {
    this.initMonthlyRevenueChart();
    this.initRevenueByZoneBarChart();
    this.initRevenueByZoneDonutChart();
  }

  private initMonthlyRevenueChart(): void {
    const el = document.querySelector('#monthly-revenue-chart');
    if (!el || !this.rental?.charts?.monthlyRentRevenue?.data?.length) return;

    const chartData = this.rental.charts.monthlyRentRevenue;

    this.monthlyRevenueChart = new ApexCharts(el, {
      chart: { type: 'area', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      series: [{ name: 'Revenus Loyers (Ar)', data: chartData.data }],
      xaxis: { categories: chartData.labels },
      yaxis: {
        title: { text: 'Revenus (Ar)' },
        labels: { formatter: (v: number) => this.fmt(v) }
      },
      colors: ['#4680ff'],
      stroke: { width: 2, curve: 'smooth' },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1' },
      tooltip: { y: { formatter: (v: number) => this.fmt(v) + ' Ar' } },
      markers: { size: 4, colors: ['#4680ff'], strokeWidth: 0 }
    });
    this.monthlyRevenueChart.render();
  }

  private initRevenueByZoneBarChart(): void {
    const el = document.querySelector('#revenue-zone-bar-chart');
    if (!el || !this.rental?.charts?.boutiquesByFloor?.length) return;

    const floors = this.rental.charts.boutiquesByFloor;
    const floorLabels = floors.map((f: any) => this.getFloorLabel(f._id));
    const occupied = floors.map((f: any) => f.occupied || 0);
    const available = floors.map((f: any) => f.available || 0);

    this.revenueByZoneBarChart = new ApexCharts(el, {
      chart: { type: 'bar', height: 200, toolbar: { show: false }, fontFamily: 'inherit', stacked: false },
      series: [
        { name: 'Occupées', data: occupied },
        { name: 'Disponibles', data: available }
      ],
      xaxis: { categories: floorLabels },
      colors: ['#4680ff', '#2ed8a3'],
      plotOptions: { bar: { columnWidth: '50%', borderRadius: 3 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1' },
      legend: { position: 'bottom', fontSize: '11px' }
    });
    this.revenueByZoneBarChart.render();
  }

  private initRevenueByZoneDonutChart(): void {
    const el = document.querySelector('#revenue-zone-donut-chart');
    if (!el || !this.rental?.charts?.revenueByZone?.length) return;

    const zones = this.rental.charts.revenueByZone;
    const labels = zones.map((z: any) => z._id || 'Autre');
    const revenues = zones.map((z: any) => z.revenue || 0);

    this.revenueByZoneDonutChart = new ApexCharts(el, {
      chart: { type: 'donut', height: 250, fontFamily: 'inherit' },
      series: revenues,
      labels,
      colors: ['#4680ff', '#2ed8a3', '#ffba57', '#ff5370', '#6c5ce7', '#00bcd4'],
      legend: { position: 'bottom', fontSize: '11px' },
      dataLabels: { enabled: true, formatter: (val: number) => Math.round(val) + '%' },
      tooltip: { y: { formatter: (v: number) => this.fmt(v) + ' Ar' } }
    });
    this.revenueByZoneDonutChart.render();
  }

  // ===== Helpers =====

  fmt(num: number): string {
    if (num == null) return '0';
    return num.toLocaleString('fr-FR');
  }

  getFloorLabel(floor: number): string {
    if (floor === 0) return 'RDC';
    return floor + (floor === 1 ? 'er' : 'ème') + ' Étage';
  }

  getAlertClass(type: string): string {
    switch (type) {
      case 'danger': return 'text-danger';
      case 'warning': return 'text-warning';
      case 'info': return 'text-primary';
      default: return 'text-secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Admin';
      case 'boutique': return 'Boutique';
      case 'acheteur': return 'Acheteur';
      default: return role;
    }
  }

  getRoleBadge(role: string): string {
    switch (role) {
      case 'admin': return 'badge-dark';
      case 'boutique': return 'badge-success';
      case 'acheteur': return 'badge-primary';
      default: return 'badge-secondary';
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'active': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'blocked': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { StatsService } from '../../../core/services/stats.service';
import { ApiErrorBody } from '../../../core/services/auth.service';
import ApexCharts from 'apexcharts/dist/apexcharts.common.js';

@Component({
  selector: 'app-boutique-stats',
  templateUrl: './boutique-stats.component.html',
  styleUrls: ['./boutique-stats.component.scss']
})
export class BoutiqueStatsComponent implements OnInit, OnDestroy {

  loading = true;
  errorMessage = '';

  // Dashboard data
  dashboard: any = null;

  // Trends data
  trends: any = null;

  // Product trends data (monthly per product)
  topProductsTrends: any = null;
  lowProductsTrends: any = null;

  // Charts
  private revenueChart: any = null;
  private topProductsChart: any = null;
  private lowProductsChart: any = null;
  private dayOfWeekChart: any = null;

  // Month names
  private monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  private dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  private topColors = ['#4680ff', '#2ed8a3', '#ffba57', '#ff5370', '#6c5ce7'];
  private lowColors = ['#ff5370', '#ff8a65', '#ffba57', '#e57373', '#f06292'];

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    if (this.revenueChart) { this.revenueChart.destroy(); this.revenueChart = null; }
    if (this.topProductsChart) { this.topProductsChart.destroy(); this.topProductsChart = null; }
    if (this.lowProductsChart) { this.lowProductsChart.destroy(); this.lowProductsChart = null; }
    if (this.dayOfWeekChart) { this.dayOfWeekChart.destroy(); this.dayOfWeekChart = null; }
  }

  loadAllData(): void {
    this.loading = true;
    this.errorMessage = '';
    let loaded = 0;
    const totalCalls = 4;

    const checkDone = () => {
      loaded++;
      if (loaded >= totalCalls) {
        this.loading = false;
        setTimeout(() => this.initCharts(), 200);
      }
    };

    // Load dashboard
    this.statsService.getBoutiqueDashboard().subscribe({
      next: (res) => { this.dashboard = res.data; checkDone(); },
      error: (err: ApiErrorBody) => {
        this.errorMessage = err.message || 'Erreur lors du chargement.';
        checkDone();
      }
    });

    // Load trends (for revenue chart, day of week, growth)
    this.statsService.getBoutiqueTrends(12).subscribe({
      next: (res) => { this.trends = res.data; checkDone(); },
      error: (err: ApiErrorBody) => {
        if (!this.errorMessage) this.errorMessage = err.message || 'Erreur.';
        checkDone();
      }
    });

    // Load top products trends (line chart over time)
    this.statsService.getBoutiqueProductsTrends(12, 'top').subscribe({
      next: (res) => { this.topProductsTrends = res.data; checkDone(); },
      error: () => { checkDone(); }
    });

    // Load low products trends (line chart over time)
    this.statsService.getBoutiqueProductsTrends(12, 'low').subscribe({
      next: (res) => { this.lowProductsTrends = res.data; checkDone(); },
      error: () => { checkDone(); }
    });
  }

  private initCharts(): void {
    this.initRevenueChart();
    this.initTopProductsChart();
    this.initLowProductsChart();
    this.initDayOfWeekChart();
  }

  // ===== Graphique CA Mensuel (Area chart) =====
  private initRevenueChart(): void {
    const el = document.querySelector('#revenue-chart');
    if (!el || !this.trends?.monthlyTrends?.length) return;

    const monthlyTrends = this.trends.monthlyTrends;
    const labels = monthlyTrends.map((t: any) => this.monthNames[(t._id.month || 1) - 1] + ' ' + t._id.year);
    const revenueData = monthlyTrends.map((t: any) => t.revenue || 0);
    const ordersData = monthlyTrends.map((t: any) => t.ordersCount || 0);

    this.revenueChart = new ApexCharts(el, {
      chart: { type: 'area', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      series: [
        { name: 'Chiffre d\'affaires (Ar)', data: revenueData },
        { name: 'Commandes', data: ordersData }
      ],
      xaxis: { categories: labels },
      yaxis: [
        { title: { text: 'CA (Ar)' }, labels: { formatter: (val: number) => this.formatNumber(val) + ' Ar' } },
        { opposite: true, title: { text: 'Commandes' }, labels: { formatter: (val: number) => Math.round(val).toString() } }
      ],
      colors: ['#4680ff', '#2ed8a3'],
      stroke: { width: [2, 2], curve: 'smooth' },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
      tooltip: {
        y: {
          formatter: (val: number, opts: any) => {
            if (opts.seriesIndex === 0) return this.formatNumber(val) + ' Ar';
            return Math.round(val) + ' commandes';
          }
        }
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1' }
    });
    this.revenueChart.render();
  }

  // ===== Graphique Produits les plus vendus - Évolution dans le temps (Line chart) =====
  private initTopProductsChart(): void {
    const el = document.querySelector('#top-products-chart');
    if (!el || !this.topProductsTrends?.products?.length) return;

    const series = this.topProductsTrends.products.map((p: any) => ({
      name: p.productName,
      data: p.data
    }));

    this.topProductsChart = new ApexCharts(el, {
      chart: { type: 'line', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      series,
      xaxis: { categories: this.topProductsTrends.months },
      yaxis: {
        title: { text: 'Quantité vendue' },
        labels: { formatter: (val: number) => Math.round(val).toString() }
      },
      colors: this.topColors,
      stroke: { width: 3, curve: 'smooth' },
      markers: { size: 4, hover: { size: 6 } },
      tooltip: {
        y: { formatter: (val: number) => Math.round(val) + ' vendus' }
      },
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1' }
    });
    this.topProductsChart.render();
  }

  // ===== Graphique Produits les moins vendus - Évolution dans le temps (Line chart) =====
  private initLowProductsChart(): void {
    const el = document.querySelector('#low-products-chart');
    if (!el || !this.lowProductsTrends?.products?.length) return;

    const series = this.lowProductsTrends.products.map((p: any) => ({
      name: p.productName,
      data: p.data
    }));

    this.lowProductsChart = new ApexCharts(el, {
      chart: { type: 'line', height: 320, toolbar: { show: false }, fontFamily: 'inherit' },
      series,
      xaxis: { categories: this.lowProductsTrends.months },
      yaxis: {
        title: { text: 'Quantité vendue' },
        labels: { formatter: (val: number) => Math.round(val).toString() }
      },
      colors: this.lowColors,
      stroke: { width: 3, curve: 'smooth', dashArray: [0, 5, 0, 5, 0] },
      markers: { size: 4, hover: { size: 6 } },
      tooltip: {
        y: { formatter: (val: number) => Math.round(val) + ' vendus' }
      },
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1' }
    });
    this.lowProductsChart.render();
  }

  // ===== Graphique Ventes par jour de la semaine (Bar chart) =====
  private initDayOfWeekChart(): void {
    const el = document.querySelector('#day-of-week-chart');
    if (!el || !this.trends?.salesByDayOfWeek?.length) return;

    const salesByDay = this.trends.salesByDayOfWeek;
    const allDays = [1, 2, 3, 4, 5, 6, 7];
    const labels = allDays.map(d => this.dayNames[d - 1]);
    const revenues = allDays.map(d => {
      const found = salesByDay.find((s: any) => s._id === d);
      return found ? found.revenue : 0;
    });

    this.dayOfWeekChart = new ApexCharts(el, {
      chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'inherit' },
      series: [{ name: 'Revenu (Ar)', data: revenues }],
      xaxis: { categories: labels },
      colors: ['#6c5ce7'],
      plotOptions: { bar: { columnWidth: '50%', borderRadius: 6 } },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: (val: number) => this.formatNumber(val) + ' Ar' } },
      grid: { borderColor: '#f1f1f1' }
    });
    this.dayOfWeekChart.render();
  }

  // ===== Helpers =====

  formatNumber(num: number): string {
    if (num == null) return '0';
    return num.toLocaleString('fr-FR');
  }

  getGrowthClass(): string {
    if (!this.trends?.growth) return '';
    return this.trends.growth.percentage >= 0 ? 'text-success' : 'text-danger';
  }

  getGrowthIcon(): string {
    if (!this.trends?.growth) return '';
    return this.trends.growth.percentage >= 0 ? 'feather icon-trending-up' : 'feather icon-trending-down';
  }
}

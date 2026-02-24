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

  // Generate the last N months as labels and map data to them
  private generateLast12Months(): { labels: string[]; keys: string[] } {
    const now = new Date();
    const labels: string[] = [];
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      labels.push(this.monthNames[month - 1] + ' ' + year);
      keys.push(`${year}-${month}`);
    }
    return { labels, keys };
  }

  // ===== Graphique CA Mensuel (Area chart) — with 12 months filled =====
  private initRevenueChart(): void {
    const el = document.querySelector('#revenue-chart');
    if (!el) return;

    const { labels, keys } = this.generateLast12Months();
    const monthlyTrends = this.trends?.monthlyTrends || [];

    // Map API data into a lookup by "year-month"
    const dataMap = new Map<string, { revenue: number; ordersCount: number }>();
    for (const t of monthlyTrends) {
      const key = `${t._id.year}-${t._id.month}`;
      dataMap.set(key, { revenue: t.revenue || 0, ordersCount: t.ordersCount || 0 });
    }

    const revenueData = keys.map(k => dataMap.get(k)?.revenue || 0);
    const ordersData = keys.map(k => dataMap.get(k)?.ordersCount || 0);

    this.revenueChart = new ApexCharts(el, {
      chart: {
        type: 'area',
        height: 360,
        toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
        fontFamily: 'inherit',
        dropShadow: { enabled: true, top: 4, left: 0, blur: 8, opacity: 0.12, color: '#4680ff' }
      },
      series: [
        { name: 'Chiffre d\'affaires (Ar)', data: revenueData },
        { name: 'Commandes', data: ordersData }
      ],
      xaxis: {
        categories: labels,
        labels: { style: { fontSize: '11px', colors: '#999' }, rotate: -45, rotateAlways: false },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: [
        { title: { text: 'CA (Ar)', style: { fontSize: '12px', fontWeight: 600, color: '#666' } }, labels: { formatter: (val: number) => this.formatNumber(val) + ' Ar', style: { fontSize: '11px', colors: '#999' } } },
        { opposite: true, title: { text: 'Commandes', style: { fontSize: '12px', fontWeight: 600, color: '#666' } }, labels: { formatter: (val: number) => Math.round(val).toString(), style: { fontSize: '11px', colors: '#999' } } }
      ],
      colors: ['#4680ff', '#2ed8a3'],
      stroke: { width: [3, 3], curve: 'smooth' },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number, opts: any) => {
            if (opts.seriesIndex === 0) return this.formatNumber(val) + ' Ar';
            return Math.round(val) + ' commandes';
          }
        }
      },
      markers: { size: 4, strokeWidth: 2, hover: { size: 6 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1', strokeDashArray: 4, padding: { left: 8, right: 8 } },
      legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', fontWeight: 600, markers: { radius: 4 } }
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
      xaxis: {
        categories: this.topProductsTrends.months,
        labels: { style: { fontSize: '11px', colors: '#999' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        title: { text: 'Quantité vendue', style: { fontSize: '12px', fontWeight: 600, color: '#666' } },
        labels: { formatter: (val: number) => Math.round(val).toString(), style: { fontSize: '11px', colors: '#999' } }
      },
      colors: this.topColors,
      stroke: { width: 3, curve: 'smooth' },
      markers: { size: 5, strokeWidth: 2, hover: { size: 7 } },
      tooltip: {
        theme: 'dark',
        y: { formatter: (val: number) => Math.round(val) + ' vendus' }
      },
      legend: { position: 'bottom', fontSize: '12px', fontWeight: 500, markers: { radius: 4 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1', strokeDashArray: 4 }
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
      xaxis: {
        categories: this.lowProductsTrends.months,
        labels: { style: { fontSize: '11px', colors: '#999' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        title: { text: 'Quantité vendue', style: { fontSize: '12px', fontWeight: 600, color: '#666' } },
        labels: { formatter: (val: number) => Math.round(val).toString(), style: { fontSize: '11px', colors: '#999' } }
      },
      colors: this.lowColors,
      stroke: { width: 3, curve: 'smooth', dashArray: [0, 5, 0, 5, 0] },
      markers: { size: 5, strokeWidth: 2, hover: { size: 7 } },
      tooltip: {
        theme: 'dark',
        y: { formatter: (val: number) => Math.round(val) + ' vendus' }
      },
      legend: { position: 'bottom', fontSize: '12px', fontWeight: 500, markers: { radius: 4 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f1f1', strokeDashArray: 4 }
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
      chart: { type: 'bar', height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
      series: [{ name: 'Revenu (Ar)', data: revenues }],
      xaxis: {
        categories: labels,
        labels: { style: { fontSize: '12px', fontWeight: 600, colors: '#666' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { formatter: (val: number) => this.formatNumber(val), style: { fontSize: '11px', colors: '#999' } }
      },
      colors: ['#6c5ce7'],
      plotOptions: {
        bar: {
          columnWidth: '45%',
          borderRadius: 8,
          distributed: true,
          dataLabels: { position: 'top' }
        }
      },
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.4, opacityFrom: 1, opacityTo: 0.85, stops: [0, 100] }
      },
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'dark',
        y: { formatter: (val: number) => this.formatNumber(val) + ' Ar' }
      },
      grid: { borderColor: '#f1f1f1', strokeDashArray: 4 },
      legend: { show: false }
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

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Floor } from '../../../../../core/services/floor.service';
import { Zone } from '../../../../../core/services/zone.service';
import { SpecialSpace } from '../../../../../core/services/special-space.service';
import { MapBoutique } from '../../../../../core/services/map.service';

@Component({
  selector: 'app-map-svg',
  templateUrl: './map-svg.component.html',
  styleUrls: ['./map-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapSvgComponent {
  @Input() floor: Floor | null = null;
  @Input() zones: Zone[] = [];
  @Input() boutiques: MapBoutique[] = [];
  @Input() specialSpaces: SpecialSpace[] = [];
  @Input() isEditMode = false;
  @Input() selectedZoneId: string | null = null;
  @Input() selectedBoutiqueId: string | null = null;
  @Input() routePoints: { x: number; y: number }[] = [];
  @Input() currentPosition: { x: number; y: number } | null = null;

  @Output() zoneClick = new EventEmitter<Zone>();
  @Output() boutiqueClick = new EventEmitter<MapBoutique>();
  @Output() specialSpaceClick = new EventEmitter<SpecialSpace>();

  get viewBox(): string {
    if (!this.floor) return '0 0 100 100';
    return `0 0 ${this.floor.width} ${this.floor.height}`;
  }

  get routePointsStr(): string {
    if (!this.routePoints.length) return '';
    return this.routePoints.map(p => `${p.x},${p.y}`).join(' ');
  }

  getBoutiqueLabel(b: MapBoutique): string {
    return b.name || (b.location?.number) || b._id?.slice(-6) || '';
  }

  getSpecialSpaceIcon(type: string): string {
    const icons: Record<string, string> = {
      relax: '🌳',
      toilets: '🚻',
      stairs: '🪜',
      elevator: '🛗',
      exit: '🚪',
      parking: '🅿️'
    };
    return icons[type] || '▪';
  }

  onZoneClick(z: Zone): void {
    this.zoneClick.emit(z);
  }

  onBoutiqueClick(b: MapBoutique): void {
    this.boutiqueClick.emit(b);
  }

  onSpecialSpaceClick(s: SpecialSpace): void {
    this.specialSpaceClick.emit(s);
  }
}

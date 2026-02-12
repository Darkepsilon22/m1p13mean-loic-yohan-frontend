import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  OnDestroy
} from '@angular/core';
import { Floor } from '../../../../../core/services/floor.service';
import { Zone } from '../../../../../core/services/zone.service';
import { SpecialSpace } from '../../../../../core/services/special-space.service';
import { MapBoutique } from '../../../../../core/services/map.service';

const MIN_SIZE = 2;
const HANDLE_SIZE = 1.5;

export interface ShapeChange {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-map-svg',
  templateUrl: './map-svg.component.html',
  styleUrls: ['./map-svg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapSvgComponent implements OnDestroy {
  @Input() floor: Floor | null = null;
  @Input() zones: Zone[] = [];
  @Input() boutiques: MapBoutique[] = [];
  @Input() specialSpaces: SpecialSpace[] = [];
  @Input() isEditMode = false;
  @Input() selectedZoneId: string | null = null;
  @Input() selectedBoutiqueId: string | null = null;
  @Input() selectedSpecialSpaceId: string | null = null;
  @Input() routePoints: { x: number; y: number }[] = [];
  @Input() currentPosition: { x: number; y: number } | null = null;

  @Output() zoneClick = new EventEmitter<Zone>();
  @Output() boutiqueClick = new EventEmitter<MapBoutique>();
  @Output() specialSpaceClick = new EventEmitter<SpecialSpace>();
  @Output() zoneShapeChange = new EventEmitter<ShapeChange>();
  @Output() spaceShapeChange = new EventEmitter<ShapeChange>();
  @Output() boutiqueShapeChange = new EventEmitter<ShapeChange>();

  /** Pendant drag ou resize : position/taille courante pour l’élément en cours */
  dragState: { type: 'zone' | 'space' | 'boutique'; id: string; x: number; y: number; width: number; height: number } | null = null;
  private dragStartClient = { x: 0, y: 0 };
  private dragStartRect = { x: 0, y: 0, width: 0, height: 0 };
  private isResize: 'se' | 'sw' | 'ne' | 'nw' | null = null;
  private didDragOrResize = false;
  private dragSvg: SVGSVGElement | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.clearDragListeners();
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(evt: MouseEvent): void {
    if (!this.dragState || !this.dragSvg) return;
    this.didDragOrResize = true;
    const pt = this.clientToSvg(this.dragSvg, evt.clientX, evt.clientY);
    if (this.isResize) {
      this.updateResize(pt.x, pt.y);
    } else {
      this.dragState.x = this.dragStartRect.x + (pt.x - this.dragStartClient.x);
      this.dragState.y = this.dragStartRect.y + (pt.y - this.dragStartClient.y);
      this.clampToFloor();
    }
    this.cdr.markForCheck();
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    if (!this.dragState) return;
    if (this.didDragOrResize) {
      const payload: ShapeChange = {
        id: this.dragState.id,
        x: this.dragState.x,
        y: this.dragState.y,
        width: this.dragState.width,
        height: this.dragState.height
      };
      if (this.dragState.type === 'zone') this.zoneShapeChange.emit(payload);
      else if (this.dragState.type === 'space') this.spaceShapeChange.emit(payload);
      else this.boutiqueShapeChange.emit(payload);
    }
    this.clearDragListeners();
  }

  private clearDragListeners(): void {
    if (this.dragState) {
      this.dragState = null;
      this.dragSvg = null;
      this.isResize = null;
      this.didDragOrResize = false;
      this.cdr.markForCheck();
    }
  }

  private getSvgFromEvent(evt: MouseEvent): SVGSVGElement | null {
    const t = evt.target as Node;
    if (!t) return null;
    let n: Node | null = t;
    while (n) {
      if (n.nodeName === 'svg') return n as SVGSVGElement;
      n = n.parentNode;
    }
    return null;
  }

  private clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = svg.getScreenCTM()?.inverse();
    if (!m) return { x: 0, y: 0 };
    const p = pt.matrixTransform(m);
    return { x: p.x, y: p.y };
  }

  private clampToFloor(): void {
    if (!this.dragState || !this.floor) return;
    const fw = this.floor.width;
    const fh = this.floor.height;
    this.dragState.x = Math.max(0, Math.min(fw - this.dragState.width, this.dragState.x));
    this.dragState.y = Math.max(0, Math.min(fh - this.dragState.height, this.dragState.y));
  }

  private updateResize(clientSvgX: number, clientSvgY: number): void {
    if (!this.dragState || !this.isResize || !this.floor) return;
    const dx = clientSvgX - this.dragStartClient.x;
    const dy = clientSvgY - this.dragStartClient.y;
    const r = this.dragStartRect;
    let { x, y, width, height } = r;
    switch (this.isResize) {
      case 'se':
        width = Math.max(MIN_SIZE, r.width + dx);
        height = Math.max(MIN_SIZE, r.height + dy);
        break;
      case 'sw':
        x = r.x + dx;
        width = Math.max(MIN_SIZE, r.width - dx);
        height = Math.max(MIN_SIZE, r.height + dy);
        break;
      case 'ne':
        y = r.y + dy;
        width = Math.max(MIN_SIZE, r.width + dx);
        height = Math.max(MIN_SIZE, r.height - dy);
        break;
      case 'nw':
        x = r.x + dx;
        y = r.y + dy;
        width = Math.max(MIN_SIZE, r.width - dx);
        height = Math.max(MIN_SIZE, r.height - dy);
        break;
    }
    this.dragState.x = Math.max(0, x);
    this.dragState.y = Math.max(0, y);
    this.dragState.width = Math.min(this.floor.width - this.dragState.x, Math.max(MIN_SIZE, width));
    this.dragState.height = Math.min(this.floor.height - this.dragState.y, Math.max(MIN_SIZE, height));
  }

  startDragZone(evt: MouseEvent, z: Zone): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.didDragOrResize = false;
    const svg = this.getSvgFromEvent(evt);
    if (!svg) return;
    this.dragSvg = svg;
    const pt = this.clientToSvg(svg, evt.clientX, evt.clientY);
    this.dragStartClient = { x: pt.x, y: pt.y };
    this.dragStartRect = { x: z.x, y: z.y, width: z.width, height: z.height };
    this.dragState = { type: 'zone', id: z._id, x: z.x, y: z.y, width: z.width, height: z.height };
    this.isResize = null;
    this.cdr.markForCheck();
  }

  startResizeZone(evt: MouseEvent, z: Zone, handle: 'se' | 'sw' | 'ne' | 'nw'): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.didDragOrResize = false;
    const svg = this.getSvgFromEvent(evt);
    if (!svg) return;
    this.dragSvg = svg;
    const pt = this.clientToSvg(svg, evt.clientX, evt.clientY);
    this.dragStartClient = { x: pt.x, y: pt.y };
    this.dragStartRect = { x: z.x, y: z.y, width: z.width, height: z.height };
    this.dragState = { type: 'zone', id: z._id, x: z.x, y: z.y, width: z.width, height: z.height };
    this.isResize = handle;
    this.cdr.markForCheck();
  }

  startDragSpace(evt: MouseEvent, s: SpecialSpace): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.didDragOrResize = false;
    const svg = this.getSvgFromEvent(evt);
    if (!svg) return;
    this.dragSvg = svg;
    const pt = this.clientToSvg(svg, evt.clientX, evt.clientY);
    this.dragStartClient = { x: pt.x, y: pt.y };
    this.dragStartRect = { x: s.x, y: s.y, width: s.width, height: s.height };
    this.dragState = { type: 'space', id: s._id, x: s.x, y: s.y, width: s.width, height: s.height };
    this.isResize = null;
    this.cdr.markForCheck();
  }

  startResizeSpace(evt: MouseEvent, s: SpecialSpace, handle: 'se' | 'sw' | 'ne' | 'nw'): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.didDragOrResize = false;
    const svg = this.getSvgFromEvent(evt);
    if (!svg) return;
    this.dragSvg = svg;
    const pt = this.clientToSvg(svg, evt.clientX, evt.clientY);
    this.dragStartClient = { x: pt.x, y: pt.y };
    this.dragStartRect = { x: s.x, y: s.y, width: s.width, height: s.height };
    this.dragState = { type: 'space', id: s._id, x: s.x, y: s.y, width: s.width, height: s.height };
    this.isResize = handle;
    this.cdr.markForCheck();
  }

  startDragBoutique(evt: MouseEvent, b: MapBoutique): void {
    if (!b.mapShape) return;
    evt.preventDefault();
    evt.stopPropagation();
    this.didDragOrResize = false;
    const svg = this.getSvgFromEvent(evt);
    if (!svg) return;
    this.dragSvg = svg;
    const pt = this.clientToSvg(svg, evt.clientX, evt.clientY);
    this.dragStartClient = { x: pt.x, y: pt.y };
    this.dragStartRect = { x: b.mapShape.x, y: b.mapShape.y, width: b.mapShape.width, height: b.mapShape.height };
    this.dragState = { type: 'boutique', id: b._id, x: b.mapShape.x, y: b.mapShape.y, width: b.mapShape.width, height: b.mapShape.height };
    this.isResize = null;
    this.cdr.markForCheck();
  }

  startResizeBoutique(evt: MouseEvent, b: MapBoutique, handle: 'se' | 'sw' | 'ne' | 'nw'): void {
    if (!b.mapShape) return;
    evt.preventDefault();
    evt.stopPropagation();
    this.didDragOrResize = false;
    const svg = this.getSvgFromEvent(evt);
    if (!svg) return;
    this.dragSvg = svg;
    const pt = this.clientToSvg(svg, evt.clientX, evt.clientY);
    this.dragStartClient = { x: pt.x, y: pt.y };
    this.dragStartRect = { x: b.mapShape.x, y: b.mapShape.y, width: b.mapShape.width, height: b.mapShape.height };
    this.dragState = { type: 'boutique', id: b._id, x: b.mapShape.x, y: b.mapShape.y, width: b.mapShape.width, height: b.mapShape.height };
    this.isResize = handle;
    this.cdr.markForCheck();
  }

  onMouseMoveDrag(): void {
    this.didDragOrResize = true;
  }

  getZoneX(z: Zone): number {
    if (this.dragState?.type === 'zone' && this.dragState.id === z._id) return this.dragState.x;
    return z.x;
  }
  getZoneY(z: Zone): number {
    if (this.dragState?.type === 'zone' && this.dragState.id === z._id) return this.dragState.y;
    return z.y;
  }
  getZoneWidth(z: Zone): number {
    if (this.dragState?.type === 'zone' && this.dragState.id === z._id) return this.dragState.width;
    return z.width;
  }
  getZoneHeight(z: Zone): number {
    if (this.dragState?.type === 'zone' && this.dragState.id === z._id) return this.dragState.height;
    return z.height;
  }

  getSpaceX(s: SpecialSpace): number {
    if (this.dragState?.type === 'space' && this.dragState.id === s._id) return this.dragState.x;
    return s.x;
  }
  getSpaceY(s: SpecialSpace): number {
    if (this.dragState?.type === 'space' && this.dragState.id === s._id) return this.dragState.y;
    return s.y;
  }
  getSpaceWidth(s: SpecialSpace): number {
    if (this.dragState?.type === 'space' && this.dragState.id === s._id) return this.dragState.width;
    return s.width;
  }
  getSpaceHeight(s: SpecialSpace): number {
    if (this.dragState?.type === 'space' && this.dragState.id === s._id) return this.dragState.height;
    return s.height;
  }

  getBoutiqueX(b: MapBoutique): number {
    if (!b.mapShape) return 0;
    if (this.dragState?.type === 'boutique' && this.dragState.id === b._id) return this.dragState.x;
    return b.mapShape.x;
  }
  getBoutiqueY(b: MapBoutique): number {
    if (!b.mapShape) return 0;
    if (this.dragState?.type === 'boutique' && this.dragState.id === b._id) return this.dragState.y;
    return b.mapShape.y;
  }
  getBoutiqueWidth(b: MapBoutique): number {
    if (!b.mapShape) return 0;
    if (this.dragState?.type === 'boutique' && this.dragState.id === b._id) return this.dragState.width;
    return b.mapShape.width;
  }
  getBoutiqueHeight(b: MapBoutique): number {
    if (!b.mapShape) return 0;
    if (this.dragState?.type === 'boutique' && this.dragState.id === b._id) return this.dragState.height;
    return b.mapShape.height;
  }

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

  get HANDLE_SIZE(): number {
    return HANDLE_SIZE;
  }

  onZoneClick(z: Zone): void {
    if (this.didDragOrResize) return;
    this.zoneClick.emit(z);
  }

  onBoutiqueClick(b: MapBoutique): void {
    if (this.didDragOrResize) return;
    this.boutiqueClick.emit(b);
  }

  onSpecialSpaceClick(s: SpecialSpace): void {
    if (this.didDragOrResize) return;
    this.specialSpaceClick.emit(s);
  }
}

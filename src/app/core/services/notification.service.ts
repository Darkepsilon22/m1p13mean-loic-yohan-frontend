import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  event: string;
  message: string;
  data: any;
  read: boolean;
  timestamp: Date;
}

const SOCKET_EVENTS: { event: string; message: (d: any) => string }[] = [
  { event: 'user:registered', message: d => `Nouvel utilisateur inscrit : ${d.email}` },
  { event: 'user:profileUpdated', message: d => `Profil mis à jour : ${d.firstName} ${d.lastName}` },
  { event: 'user:statusChanged', message: d => `Votre statut a été changé en "${d.status}"` },
  { event: 'user:approved', message: () => 'Votre compte a été approuvé' },
  { event: 'user:rejected', message: d => `Votre compte a été rejeté${d.reason ? ' : ' + d.reason : ''}` },
  { event: 'user:blocked', message: () => 'Votre compte a été bloqué' },
  { event: 'user:unblocked', message: () => 'Votre compte a été débloqué' },

  { event: 'boutique:created', message: d => `Nouvelle boutique créée : ${d.name}` },
  { event: 'boutique:updated', message: d => `Boutique mise à jour : ${d.name}` },
  { event: 'boutique:statusChanged', message: d => `Statut de boutique changé : ${d.name} → ${d.status}` },
  { event: 'boutique:deleted', message: d => `Boutique supprimée : ${d.name}` },
  { event: 'boutique:released', message: () => 'Votre boutique a été libérée' },

  { event: 'reservation:created', message: () => 'Nouvelle réservation de boutique' },
  { event: 'reservation:confirmed', message: () => 'Réservation confirmée' },
  { event: 'reservation:cancelled', message: () => 'Réservation annulée' },
  { event: 'reservation:validated', message: () => 'Votre réservation a été validée' },
  { event: 'reservation:rejected', message: d => `Votre réservation a été refusée${d.reason ? ' : ' + d.reason : ''}` },

  { event: 'contract:created', message: d => `Nouveau contrat créé : ${d.reference}` },
  { event: 'contract:sentForSignature', message: d => `Contrat ${d.reference} en attente de votre signature` },
  { event: 'contract:signed', message: d => `Contrat ${d.reference} signé` },
  { event: 'contract:depositPaid', message: d => `Dépôt de garantie payé pour le contrat ${d.reference}` },
  { event: 'contract:depositConfirmed', message: d => `Dépôt confirmé pour le contrat ${d.reference}` },
  { event: 'contract:activated', message: d => `Contrat ${d.reference} activé` },
  { event: 'contract:suspended', message: d => `Contrat ${d.reference} suspendu${d.reason ? ' : ' + d.reason : ''}` },
  { event: 'contract:reactivated', message: d => `Contrat ${d.reference} réactivé` },
  { event: 'contract:terminated', message: d => `Contrat ${d.reference} résilié${d.reason ? ' : ' + d.reason : ''}` },

  { event: 'category:created', message: d => `Nouvelle catégorie : ${d.name}` },
  { event: 'category:updated', message: d => `Catégorie mise à jour : ${d.name}` },
  { event: 'category:statusChanged', message: d => `Catégorie ${d.isActive ? 'activée' : 'désactivée'} : ${d.name}` },
  { event: 'category:deleted', message: d => `Catégorie supprimée : ${d.name}` },

  { event: 'event:created', message: d => `Nouvel événement créé : ${d.title}` },
  { event: 'event:updated', message: d => `Événement mis à jour : ${d.title}` },
  { event: 'event:published', message: d => `Événement publié : ${d.title}` },
  { event: 'event:cancelled', message: d => `Événement annulé : ${d.title}` },
  { event: 'event:deleted', message: d => `Événement supprimé : ${d.title}` },

  { event: 'floor:created', message: d => `Nouvel étage créé : ${d.name}` },
  { event: 'floor:updated', message: d => `Étage mis à jour : ${d.name}` },
  { event: 'floor:deleted', message: d => `Étage supprimé : ${d.name}` },

  { event: 'navigation:nodeCreated', message: d => `Noeud de navigation créé : ${d.label || d.nodeId}` },
  { event: 'navigation:nodeUpdated', message: d => `Noeud de navigation mis à jour : ${d.label || d.nodeId}` },
  { event: 'navigation:nodeDeleted', message: () => 'Noeud de navigation supprimé' },
  { event: 'navigation:edgeCreated', message: () => 'Arête de navigation créée' },
  { event: 'navigation:edgeUpdated', message: () => 'Arête de navigation mise à jour' },
  { event: 'navigation:edgeDeleted', message: () => 'Arête de navigation supprimée' },

  { event: 'order:created', message: d => `Nouvelle commande : ${d.reference}` },
  { event: 'order:cancelled', message: d => `Commande annulée : ${d.reference}` },
  { event: 'order:statusUpdated', message: d => {
    const statusLabels: Record<string, string> = {
      confirmed: 'confirmée',
      processing: 'en préparation',
      shipped: 'expédiée',
      delivered: 'livrée',
      completed: 'terminée'
    };
    const label = statusLabels[d.status] || d.status;
    return `Commande ${d.reference} : ${label}`;
  }},
  { event: 'order:receptionConfirmed', message: d => `${d.customerName} a confirmé la réception de la commande ${d.reference}` },

  { event: 'invoice:created', message: d => `Nouvelle facture : ${d.reference}` },
  { event: 'invoice:paymentRecorded', message: d => `Paiement enregistré sur la facture ${d.reference}` },
  { event: 'invoice:paid', message: d => `Facture ${d.reference} entièrement payée` },
  { event: 'invoice:cancelled', message: d => `Facture ${d.reference} annulée` },

  { event: 'payment:initialized', message: d => `Paiement initialisé : ${d.paymentRef}` },
  { event: 'payment:confirmed', message: d => `Paiement confirmé : ${d.paymentRef}` },
  { event: 'payment:failed', message: d => `Paiement échoué : ${d.paymentRef}` },
  { event: 'payment:refunded', message: d => `Remboursement effectué : ${d.paymentRef}` },

  { event: 'product:created', message: d => `Nouveau produit : ${d.name}` },
  { event: 'product:updated', message: d => `Produit mis à jour : ${d.name}` },
  { event: 'product:availabilityChanged', message: d => `Disponibilité modifiée : ${d.name}` },
  { event: 'product:featuredToggled', message: d => `Produit ${d.isFeatured ? 'mis en avant' : 'retiré de la vitrine'} : ${d.name}` },
  { event: 'product:archived', message: d => `Produit archivé : ${d.name}` },
  { event: 'product:restored', message: d => `Produit restauré : ${d.name}` },

  { event: 'promotion:created', message: d => `Nouvelle promotion : ${d.title}` },
  { event: 'promotion:updated', message: d => `Promotion mise à jour : ${d.title}` },
  { event: 'promotion:cancelled', message: d => `Promotion annulée : ${d.title}` },
  { event: 'promotion:deleted', message: () => 'Promotion supprimée' },

  { event: 'review:created', message: d => `Nouvel avis reçu (${d.rating}★)` },
  { event: 'review:updated', message: () => 'Avis mis à jour' },
  { event: 'review:responseAdded', message: () => 'Réponse ajoutée à votre avis' },
  { event: 'review:statusChanged', message: d => `Statut de votre avis changé : ${d.status}` },
  { event: 'review:reported', message: d => `Avis signalé (${d.reportCount} signalements)` },
  { event: 'review:deleted', message: () => 'Avis supprimé' },

  { event: 'specialSpace:created', message: d => `Espace spécial créé : ${d.name}` },
  { event: 'specialSpace:updated', message: d => `Espace spécial mis à jour : ${d.name}` },
  { event: 'specialSpace:deleted', message: () => 'Espace spécial supprimé' },

  { event: 'stripe:sessionCreated', message: () => 'Session de paiement Stripe créée' },
  { event: 'stripe:paymentVerified', message: d => `Paiement Stripe vérifié : ${d.paymentRef}` },
  { event: 'stripe:webhookProcessed', message: d => `Webhook Stripe traité : ${d.type}` },

  { event: 'stock:added', message: d => `Stock ajouté : +${d.quantity} unités` },
  { event: 'stock:removed', message: d => `Stock retiré : -${d.quantity} unités` },
  { event: 'stock:adjusted', message: () => 'Stock ajusté' },
  { event: 'stock:initialized', message: d => `Stock initialisé : ${d.quantity} unités` },

  { event: 'zone:created', message: d => `Nouvelle zone créée : ${d.name}` },
  { event: 'zone:updated', message: d => `Zone mise à jour : ${d.name}` },
  { event: 'zone:deleted', message: d => `Zone supprimée : ${d.name}` },

  { event: 'cart:itemAdded', message: () => 'Produit ajouté au panier' },
  { event: 'cart:itemUpdated', message: () => 'Quantité mise à jour dans le panier' },
  { event: 'cart:itemRemoved', message: () => 'Produit retiré du panier' },
  { event: 'cart:cleared', message: () => 'Panier vidé' }
];

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private newNotification$ = new Subject<AppNotification>();
  private destroyed$ = new Subject<void>();
  private idCounter = 0;

  constructor(
    private socketService: SocketService,
    private auth: AuthService
  ) {}

  get notifications(): Observable<AppNotification[]> {
    return this.notifications$.asObservable();
  }

  get unreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  get onNewNotification(): Observable<AppNotification> {
    return this.newNotification$.asObservable();
  }

  init(): void {
    if (!this.auth.isLoggedIn()) return;

    this.socketService.connect();

    SOCKET_EVENTS.forEach(({ event, message }) => {
      this.socketService.on(event)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(data => {
          const notif: AppNotification = {
            id: `notif-${++this.idCounter}-${Date.now()}`,
            event,
            message: message(data || {}),
            data,
            read: false,
            timestamp: new Date()
          };

          const current = this.notifications$.value;
          const updated = [notif, ...current].slice(0, 50);
          this.notifications$.next(updated);
          this.unreadCount$.next(updated.filter(n => !n.read).length);
          this.newNotification$.next(notif);
        });
    });
  }

  markAsRead(id: string): void {
    const current = this.notifications$.value;
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    this.notifications$.next(updated);
    this.unreadCount$.next(updated.filter(n => !n.read).length);
  }

  markAllAsRead(): void {
    const current = this.notifications$.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
    this.unreadCount$.next(0);
  }

  clearAll(): void {
    this.notifications$.next([]);
    this.unreadCount$.next(0);
  }

  destroy(): void {
    this.destroyed$.next();
    this.socketService.disconnect();
    this.notifications$.next([]);
    this.unreadCount$.next(0);
  }

  ngOnDestroy(): void {
    this.destroy();
    this.destroyed$.complete();
  }
}

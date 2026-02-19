import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private destroyed$ = new Subject<void>();

  constructor(private auth: AuthService) {}

  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  get isConnected(): boolean {
    return this.connected$.value;
  }

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.auth.getToken();
    if (!token) return;

    const socketConfig = environment.socket;
    this.socket = io(environment.wsUrl || window.location.origin, {
      auth: { token },
      transports: socketConfig.transports as any,
      reconnection: true,
      reconnectionAttempts: socketConfig.reconnectionAttempts,
      reconnectionDelay: socketConfig.reconnectionDelay,
      reconnectionDelayMax: socketConfig.reconnectionDelayMax,
      timeout: socketConfig.timeout
    });

    this.socket.on('connect', () => {
      console.log('[Socket.io] Connecté :', this.socket?.id);
      this.connected$.next(true);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[Socket.io] Déconnecté :', reason);
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('[Socket.io] Erreur de connexion :', err.message);
      this.connected$.next(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  on<T = any>(event: string): Observable<T> {
    return new Observable<T>(subscriber => {
      if (!this.socket) {
        this.connect();
      }
      const handler = (data: T) => subscriber.next(data);
      this.socket?.on(event, handler);
      return () => {
        this.socket?.off(event, handler);
      };
    });
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.disconnect();
  }
}

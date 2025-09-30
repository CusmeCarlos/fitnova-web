// src/app/shared/sidebar/sidebar.component.ts
// SIDEBAR RETRÁCTIL PREMIUM COMO FINZENAPP - ACTUALIZADO FASE 18

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { User } from '../../interfaces/user.interface';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Material Design
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  subItems?: NavigationItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentRoute: string = '';
  isCollapsed = false; // Estado del sidebar (collapsed/expanded)
  private subscriptions = new Subscription();

  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard/overview'
    },
    {
      label: 'Usuarios',
      icon: 'people',
      route: '/users'
    },
    {
      label: 'Rutinas IA',
      icon: 'smart_toy',
      route: '/routines',
      badge: 3
    },
    {
      label: 'Alertas',
      icon: 'warning',
      route: '/alerts',
      badge: 5
    },
    {
      label: 'Analytics',
      icon: 'analytics',
      route: '/analytics'
    },
    // ✅ NUEVO ITEM - FASE 18: EQUIPAMIENTO
    {
      label: 'Equipamiento',
      icon: 'fitness_center',
      route: '/equipment'
      // badge: 0 // Opcional: agregar contador de equipos que necesitan mantenimiento
    },
    {
      label: 'Configuración',
      icon: 'settings',
      route: '/settings'
    }
  ];

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.watchRouteChanges();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadCurrentUser(): void {
    const userSub = this.auth.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error cargando usuario:', error);
      }
    });

    this.subscriptions.add(userSub);
  }

  private watchRouteChanges(): void {
    const routeSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    this.subscriptions.add(routeSub);
  }

  // Método para togglear el sidebar
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  // Obtener saludo según la hora
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      console.log('Logout exitoso desde sidebar');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }
}
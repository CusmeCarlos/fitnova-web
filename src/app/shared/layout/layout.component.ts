// src/app/shared/layout/layout.component.ts
// LAYOUT RESPONSIVE PARA SIDEBAR RETRÁCTIL

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent
  ],
  template: `
    <div class="main-layout">
      <!-- Sidebar -->
      <app-sidebar #sidebar></app-sidebar>
      
      <!-- Main Content Area -->
      <main class="main-content" [class.content-collapsed]="sidebar.isCollapsed">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      min-height: 100vh;
      background: var(--primary-bg);
    }

    .main-content {
      flex: 1;
      margin-left: 280px; // Sidebar expandido
      min-height: 100vh;
      overflow-x: hidden;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.content-collapsed {
        margin-left: 70px; // Sidebar collapsed
      }
      
      @media (max-width: 768px) {
        margin-left: 0;
        
        &.content-collapsed {
          margin-left: 0;
        }
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  
  ngOnInit() {
    // Inicialización si es necesaria
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }
}
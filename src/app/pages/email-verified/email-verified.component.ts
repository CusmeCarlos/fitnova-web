// src/app/pages/email-verified/email-verified.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-email-verified',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.scss']
})
export class EmailVerifiedComponent implements OnInit {
  ngOnInit() {
    console.log('🔍 Email Verified Component iniciado');
    console.log('✅ Página de verificación mostrada');
    console.log('ℹ️ Firebase ya verificó el email automáticamente');
    console.log('ℹ️ La sincronización con Firestore ocurrirá cuando el usuario inicie sesión en la app móvil');
  }

  downloadApp() {
    window.open('https://play.google.com/store', '_blank');
  }

  goToWebsite() {
    window.location.href = '/auth/login';
  }
}
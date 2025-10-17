// src/app/pages/email-verified/email-verified.component.ts
import { Component } from '@angular/core';
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
export class EmailVerifiedComponent {
  
  downloadApp() {
    // Aquí puedes poner el link de descarga de tu app móvil
    window.open('https://play.google.com/store', '_blank');
  }

  goToWebsite() {
    window.location.href = '/auth/login';
  }
}
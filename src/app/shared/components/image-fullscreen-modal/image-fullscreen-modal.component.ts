// src/app/shared/components/image-fullscreen-modal/image-fullscreen-modal.component.ts
// 🖼️ MODAL ULTRA PREMIUM PARA CAPTURAS DE ERRORES CRÍTICOS

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ImageModalData {
  imageUrl: string;
  title: string;
  subtitle?: string;
  errorType?: string;
  exercise?: string;
  timestamp?: any;
  confidence?: number;
}

@Component({
  selector: 'app-image-fullscreen-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './image-fullscreen-modal.component.html',
  styleUrls: ['./image-fullscreen-modal.component.scss']
})
export class ImageFullscreenModalComponent {
  
  // Estados del componente
  isImageLoading = true;
  hasImageError = false;
  currentZoom = 1;
  
  constructor(
    public dialogRef: MatDialogRef<ImageFullscreenModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageModalData
  ) {
    console.log('🖼️ Abriendo modal de imagen:', this.data);
  }

  // ================================================================================
  // 🎬 ACCIONES PRINCIPALES
  // ================================================================================

  closeModal(): void {
    this.dialogRef.close();
  }

  downloadImage(): void {
    try {
      const link = document.createElement('a');
      link.href = this.data.imageUrl;
      link.download = `error_capture_${Date.now()}.png`;
      link.setAttribute('crossorigin', 'anonymous');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('📥 Descarga iniciada');
    } catch (error) {
      console.error('❌ Error descargando imagen:', error);
    }
  }

  openInNewTab(): void {
    window.open(this.data.imageUrl, '_blank', 'noopener,noreferrer');
    console.log('🔗 Imagen abierta en nueva pestaña');
  }

  retryImage(): void {
    this.hasImageError = false;
    this.isImageLoading = true;
    
    // Forzar recarga agregando timestamp
    const img = new Image();
    img.onload = () => this.onImageLoad();
    img.onerror = (event) => this.onImageError(event);
    img.src = `${this.data.imageUrl}?retry=${Date.now()}`;
  }

  // ================================================================================
  // 🔍 CONTROLES DE ZOOM
  // ================================================================================

  zoomIn(): void {
    this.currentZoom = Math.min(this.currentZoom * 1.2, 3);
    this.applyZoom();
  }

  zoomOut(): void {
    this.currentZoom = Math.max(this.currentZoom / 1.2, 0.5);
    this.applyZoom();
  }

  resetZoom(): void {
    this.currentZoom = 1;
    this.applyZoom();
  }

  private applyZoom(): void {
    const img = document.querySelector('.fullscreen-image') as HTMLImageElement;
    if (img) {
      img.style.transform = `scale(${this.currentZoom})`;
    }
  }

  // ================================================================================
  // 🖼️ MANEJO DE IMAGEN
  // ================================================================================

  onImageLoad(): void {
    this.isImageLoading = false;
    this.hasImageError = false;
    console.log('✅ Imagen cargada exitosamente');
  }

  onImageError(event: any): void {
    console.warn('⚠️ Error cargando imagen en modal:', event?.target?.src || this.data.imageUrl);
    this.isImageLoading = false;
    this.hasImageError = true;
    
    // Intentar con imagen placeholder si existe
    if (event?.target) {
      event.target.src = 'assets/images/image-not-found.png';
      event.target.alt = 'Imagen no disponible';
    }
  }

  // ================================================================================
  // 🛠️ MÉTODOS UTILITARIOS
  // ================================================================================

  getErrorTypeLabel(errorType: string): string {
    const labels: Record<string, string> = {
      'knee_valgus': 'Valgo de rodilla',
      'knee_cave': 'Colapso de rodilla', 
      'forward_head': 'Cabeza adelantada',
      'rounded_shoulders': 'Hombros redondeados',
      'anterior_pelvic_tilt': 'Inclinación pélvica anterior',
      'posterior_pelvic_tilt': 'Inclinación pélvica posterior',
      'excessive_lumbar_extension': 'Hiperextensión lumbar',
      'excessive_lumbar_flexion': 'Flexión lumbar excesiva',
      'knee_alignment': 'Alineación de rodilla',
      'hip_drop': 'Caída de cadera',
      'ankle_collapse': 'Colapso de tobillo'
    };

    return labels[errorType] || errorType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Error desconocido';
  }

  formatTimestamp(timestamp: any): string {
    try {
      let date: Date;
      
      if (timestamp?.toDate) {
        // Firebase Timestamp
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return 'Fecha no disponible';
      }

      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('⚠️ Error formateando timestamp:', error);
      return 'Fecha no válida';
    }
  }
}
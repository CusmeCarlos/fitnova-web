// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// ✅ FIREBASE IMPORTS
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';

// ✅ MATERIAL DESIGN
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';


import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ ROUTING
    provideRouter(routes),
    
    // ✅ ANIMATIONS PARA MATERIAL
    provideAnimationsAsync(),
    
    // ✅ HTTP CLIENT
    provideHttpClient(withInterceptorsFromDi()),
    
    // ✅ FIREBASE CONFIGURATION
    importProvidersFrom(
      AngularFireModule.initializeApp(environment.firebase),
      AngularFireAuthModule,
      AngularFirestoreModule,
      AngularFireStorageModule, 
      AngularFireFunctionsModule,
      MatSnackBarModule
    ),

    
    // ✅ CONFIGURACIONES REGIONALES
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
};
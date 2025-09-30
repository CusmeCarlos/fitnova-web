// 🏋️ SERVICIO DE GESTIÓN DE EQUIPAMIENTO - DATOS REALES FIREBASE

import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators';
import { GymEquipment } from '../interfaces/gym-management.interface';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export const EQUIPMENT_CATALOG = {
'free-weights': [
  // Mancuernas - Rango Completo
  { name: 'Mancuernas 0kg (par)', weightRange: '0kg', typical: true,
    brand: 'Yanre Fitness',
    dimensions: '25cm largo x 10cm diámetro',
    maxWeight: 0,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },

  // Barras
  { name: 'Barra Olímpica 20kg', weightRange: '20kg', typical: true,
    brand: 'Shua',
    dimensions: '220cm largo, 28mm diámetro',
    maxWeight: 700,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Barra Olímpica 15kg (Técnica)', weightRange: '15kg', typical: true,
    brand: 'DHZ',
    dimensions: '200cm largo, 25mm diámetro',
    maxWeight: 300,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Barra Olímpica 10kg (Entrenamiento)', weightRange: '10kg', typical: true,
    brand: 'Yanre Fitness',
    dimensions: '170cm largo, 25mm diámetro',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Barra EZ Curl', weightRange: '10kg', typical: true,
    brand: 'Shua',
    dimensions: '120cm largo, 28mm diámetro',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Barra Recta Corta', weightRange: '10kg', typical: true,
    brand: 'DHZ',
    dimensions: '120cm largo, 28mm diámetro',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Barra Hexagonal (Trap Bar)', weightRange: '25kg', typical: false,
    brand: 'Yanre Fitness',
    dimensions: '140cm largo, 60cm ancho',
    maxWeight: 250,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Barra Multiagarre', weightRange: '12kg', typical: false,
    brand: 'Shua',
    dimensions: '190cm largo',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Barra de Seguridad (Safety Squat Bar)', weightRange: '30kg', typical: false,
    brand: 'DHZ',
    dimensions: '220cm largo',
    maxWeight: 350,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },

  // Discos Olímpicos
  { name: 'Discos Olímpicos 0kg (par)', weightRange: '0kg', typical: true,
    brand: 'Yanre Fitness',
    dimensions: '45cm diámetro (estándar IWF)',
    maxWeight: 0,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Discos Bumper 0kg (par)', weightRange: '0kg', typical: false,
    brand: 'Shua',
    dimensions: '45cm diámetro, 5cm ancho',
    maxWeight: 0,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },

  // Kettlebells
  { name: 'Kettlebell 0kg', weightRange: '0kg', typical: true,
    brand: 'NoBrand China',
    dimensions: '20cm alto x 15cm ancho',
    maxWeight: 0,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },

  // Bancos y Racks
  { name: 'Banco Plano', weightRange: '', typical: true,
    brand: 'Yanre Fitness',
    dimensions: '120cm largo x 40cm ancho x 45cm alto',
    maxWeight: 300,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Banco Ajustable (Inclinado/Declinado)', weightRange: '', typical: true,
    brand: 'DHZ',
    dimensions: '140cm largo x 50cm ancho x 45-110cm alto (ajustable)',
    maxWeight: 300,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Banco Olímpico para Press', weightRange: '', typical: true,
    brand: 'Shua',
    dimensions: '170cm largo x 120cm ancho x 120cm alto',
    maxWeight: 400,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Banco Scott (Predicador)', weightRange: '', typical: false,
    brand: 'Yanre Fitness',
    dimensions: '90cm largo x 70cm ancho x 100cm alto',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Banco Hiperextensión 45°', weightRange: '', typical: false,
    brand: 'NoBrand China',
    dimensions: '120cm largo x 70cm ancho x 90cm alto',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Banco Abdominal Ajustable', weightRange: '', typical: true,
    brand: 'DHZ',
    dimensions: '150cm largo x 50cm ancho x 60-110cm alto',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Rack de Sentadillas (Squat Rack)', weightRange: '', typical: true,
    brand: 'Yanre Fitness',
    dimensions: '120cm ancho x 150cm profundo x 220cm alto',
    maxWeight: 400,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Power Rack (Jaula de Potencia)', weightRange: '', typical: true,
    brand: 'DHZ',
    dimensions: '140cm ancho x 160cm profundo x 230cm alto',
    maxWeight: 500,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Half Rack', weightRange: '', typical: false,
    brand: 'Shua',
    dimensions: '120cm ancho x 140cm profundo x 230cm alto',
    maxWeight: 350,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Rack de Mancuernas (3 niveles)', weightRange: '', typical: true,
    brand: 'Yanre Fitness',
    dimensions: '200cm largo x 60cm ancho x 100cm alto',
    maxWeight: 500,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Rack de Mancuernas (5 niveles)', weightRange: '', typical: false,
    brand: 'NoBrand China',
    dimensions: '200cm largo x 60cm ancho x 150cm alto',
    maxWeight: 700,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Soporte de Barras Vertical', weightRange: '', typical: true,
    brand: 'DHZ',
    dimensions: '60cm diámetro x 120cm alto',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Soporte de Discos Olímpicos', weightRange: '', typical: true,
    brand: 'Shua',
    dimensions: '80cm largo x 70cm ancho x 120cm alto',
    maxWeight: 400,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  },
  { name: 'Árbol de Discos (Plate Tree)', weightRange: '', typical: false,
    brand: 'Yanre Fitness',
    dimensions: '70cm ancho x 70cm profundo x 140cm alto',
    maxWeight: 300,
    status: 'Operacional',
    zone: 'Área Pesas Libres'
  }
],

  
  'machines': [
  // Pecho
  { name: 'Press de Pecho Horizontal', typical: true,
    brand: 'Matrix',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Press de Pecho Inclinado', typical: true,
    brand: 'Cybex',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Press de Pecho Declinado', typical: false,
    brand: 'Life Fitness',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Peck Deck (Mariposa)', typical: true,
    brand: 'Technogym',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Contractora de Pecho', typical: false,
    brand: 'Cybex',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Cruces de Cables (Cable Crossover)', typical: true,
    brand: 'Body-Solid',
    dimensions: '200cm ancho x 120cm profundo x 230cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },

  // Espalda
  { name: 'Jalón Dorsal (Lat Pulldown)', typical: true,
    brand: 'Matrix',
    dimensions: '160cm largo x 120cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Jalón al Pecho Agarre Cerrado', typical: false,
    brand: 'Cybex',
    dimensions: '160cm largo x 120cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Jalón Tras Nuca', typical: false,
    brand: 'Life Fitness',
    dimensions: '160cm largo x 120cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Remo Sentado (Cable)', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Remo con Barra T', typical: false,
    brand: 'Body-Solid',
    dimensions: '180cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Remo Horizontal Máquina', typical: true,
    brand: 'Matrix',
    dimensions: '160cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Pullover Máquina', typical: false,
    brand: 'Cybex',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Máquina de Dominadas Asistidas', typical: true,
    brand: 'Technogym',
    dimensions: '150cm ancho x 120cm profundo x 220cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Hiperextensión Lumbar', typical: true,
    brand: 'Body-Solid',
    dimensions: '140cm largo x 70cm ancho x 80cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },

  // Piernas
  { name: 'Sentadilla Guiada (Smith Machine)', typical: true,
    brand: 'Cybex',
    dimensions: '220cm largo x 140cm ancho x 230cm alto',
    weightRange: '20kg',
    maxWeight: 300,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Hack Squat (Sentadilla Hack)', typical: false,
    brand: 'Matrix',
    dimensions: '180cm largo x 140cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 250,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Leg Press 45°', typical: true,
    brand: 'Technogym',
    dimensions: '200cm largo x 120cm ancho x 150cm alto',
    weightRange: '0kg',
    maxWeight: 350,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Leg Press Horizontal', typical: false,
    brand: 'Body-Solid',
    dimensions: '200cm largo x 120cm ancho x 150cm alto',
    weightRange: '0kg',
    maxWeight: 350,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Extensión de Piernas (Cuádriceps)', typical: true,
    brand: 'Life Fitness',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Curl Femoral Acostado', typical: true,
    brand: 'Matrix',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Curl Femoral Sentado', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Abductores (Apertura de Piernas)', typical: true,
    brand: 'Body-Solid',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Aductores (Cierre de Piernas)', typical: true,
    brand: 'Life Fitness',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Prensa de Gemelos Sentado', typical: false,
    brand: 'Cybex',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Prensa de Gemelos de Pie', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Máquina de Glúteos (Glute Drive)', typical: false,
    brand: 'Matrix',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Sissy Squat', typical: false,
    brand: 'Body-Solid',
    dimensions: '120cm largo x 80cm ancho x 100cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },

  // Hombros
  { name: 'Press de Hombros Máquina', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Elevaciones Laterales Máquina', typical: false,
    brand: 'Matrix',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Remo al Mentón Máquina', typical: false,
    brand: 'Body-Solid',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Press Militar Guiado', typical: false,
    brand: 'Life Fitness',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Peck Deck Invertido (Deltoides Posterior)', typical: false,
    brand: 'Technogym',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
    // Pecho
  { name: 'Press de Pecho Horizontal', typical: true,
    brand: 'Matrix',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Press de Pecho Inclinado', typical: true,
    brand: 'Cybex',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Press de Pecho Declinado', typical: false,
    brand: 'Life Fitness',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Peck Deck (Mariposa)', typical: true,
    brand: 'Technogym',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Contractora de Pecho', typical: false,
    brand: 'Cybex',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },
  { name: 'Cruces de Cables (Cable Crossover)', typical: true,
    brand: 'Body-Solid',
    dimensions: '200cm ancho x 120cm profundo x 230cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Pecho'
  },

  // Espalda
  { name: 'Jalón Dorsal (Lat Pulldown)', typical: true,
    brand: 'Matrix',
    dimensions: '160cm largo x 120cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Jalón al Pecho Agarre Cerrado', typical: false,
    brand: 'Cybex',
    dimensions: '160cm largo x 120cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Jalón Tras Nuca', typical: false,
    brand: 'Life Fitness',
    dimensions: '160cm largo x 120cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Remo Sentado (Cable)', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Remo con Barra T', typical: false,
    brand: 'Body-Solid',
    dimensions: '180cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Remo Horizontal Máquina', typical: true,
    brand: 'Matrix',
    dimensions: '160cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Pullover Máquina', typical: false,
    brand: 'Cybex',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Máquina de Dominadas Asistidas', typical: true,
    brand: 'Technogym',
    dimensions: '150cm ancho x 120cm profundo x 220cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },
  { name: 'Hiperextensión Lumbar', typical: true,
    brand: 'Body-Solid',
    dimensions: '140cm largo x 70cm ancho x 80cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Máquinas Espalda'
  },

  // Piernas
  { name: 'Sentadilla Guiada (Smith Machine)', typical: true,
    brand: 'Cybex',
    dimensions: '220cm largo x 140cm ancho x 230cm alto',
    weightRange: '20kg',
    maxWeight: 300,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Hack Squat (Sentadilla Hack)', typical: false,
    brand: 'Matrix',
    dimensions: '180cm largo x 140cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 250,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Leg Press 45°', typical: true,
    brand: 'Technogym',
    dimensions: '200cm largo x 120cm ancho x 150cm alto',
    weightRange: '0kg',
    maxWeight: 350,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Leg Press Horizontal', typical: false,
    brand: 'Body-Solid',
    dimensions: '200cm largo x 120cm ancho x 150cm alto',
    weightRange: '0kg',
    maxWeight: 350,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Extensión de Piernas (Cuádriceps)', typical: true,
    brand: 'Life Fitness',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Curl Femoral Acostado', typical: true,
    brand: 'Matrix',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Curl Femoral Sentado', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Abductores (Apertura de Piernas)', typical: true,
    brand: 'Body-Solid',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Aductores (Cierre de Piernas)', typical: true,
    brand: 'Life Fitness',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Prensa de Gemelos Sentado', typical: false,
    brand: 'Cybex',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Prensa de Gemelos de Pie', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Máquina de Glúteos (Glute Drive)', typical: false,
    brand: 'Matrix',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },
  { name: 'Sissy Squat', typical: false,
    brand: 'Body-Solid',
    dimensions: '120cm largo x 80cm ancho x 100cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Piernas'
  },

  // Hombros
  { name: 'Press de Hombros Máquina', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 120cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Elevaciones Laterales Máquina', typical: false,
    brand: 'Matrix',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Remo al Mentón Máquina', typical: false,
    brand: 'Body-Solid',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Press Militar Guiado', typical: false,
    brand: 'Life Fitness',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },
  { name: 'Peck Deck Invertido (Deltoides Posterior)', typical: false,
    brand: 'Technogym',
    dimensions: '140cm largo x 110cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Hombros'
  },

  // Brazos
  { name: 'Curl de Bíceps Máquina', typical: true,
    brand: 'Cybex',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Máquinas Brazos'
  },
  { name: 'Extensión de Tríceps Máquina', typical: true,
    brand: 'Technogym',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Máquinas Brazos'
  },
  { name: 'Fondos Asistidos (Dips)', typical: true,
    brand: 'Body-Solid',
    dimensions: '150cm largo x 100cm ancho x 220cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Máquinas Brazos'
  },
  { name: 'Curl Predicador Máquina', typical: false,
    brand: 'Matrix',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Brazos'
  },
  { name: 'Tríceps en Polea Alta', typical: true,
    brand: 'Technogym',
    dimensions: '150cm largo x 80cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Brazos'
  },
  { name: 'Bíceps en Polea Baja', typical: false,
    brand: 'Cybex',
    dimensions: '150cm largo x 80cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Brazos'
  },

  // Core / Abdomen
  { name: 'Máquina de Abdominales (Crunch)', typical: true,
    brand: 'Technogym',
    dimensions: '120cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 80,
    status: 'Operacional',
    zone: 'Área Máquinas Core'
  },
  { name: 'Rotador de Torso', typical: false,
    brand: 'Body-Solid',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Core'
  },
  { name: 'Flexión Lateral Máquina', typical: false,
    brand: 'Matrix',
    dimensions: '140cm largo x 80cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Máquinas Core'
  },

  // Multiestaciones
  { name: 'Multipower (Smith Machine)', typical: true,
    brand: 'Cybex',
    dimensions: '220cm largo x 140cm ancho x 230cm alto',
    weightRange: '20kg',
    maxWeight: 300,
    status: 'Operacional',
    zone: 'Área Multiestaciones'
  },
  { name: 'Torre de Poleas Dobles (Cable Station)', typical: true,
    brand: 'Technogym',
    dimensions: '200cm ancho x 120cm profundo x 230cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Multiestaciones'
  },
  { name: 'Multiestación 4 Torres', typical: false,
    brand: 'Body-Solid',
    dimensions: '250cm ancho x 150cm profundo x 230cm alto',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Multiestaciones'
  },
  { name: 'Estación de Fondos y Dominadas', typical: true,
    brand: 'Matrix',
    dimensions: '150cm ancho x 100cm profundo x 220cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Multiestaciones'
  },
  { name: 'Máquina Multifuncional Home Gym', typical: false,
    brand: 'Cybex',
    dimensions: '200cm ancho x 120cm profundo x 220cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Multiestaciones'
  },
],

  
 'cardio': [
  // Caminadoras
  { name: 'Caminadora Eléctrica Básica', typical: true,
    brand: 'Life Fitness',
    dimensions: '200cm largo x 90cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Cardio Caminadoras'
  },
  { name: 'Caminadora Profesional', typical: true,
    brand: 'Technogym',
    dimensions: '210cm largo x 95cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Cardio Caminadoras'
  },
  { name: 'Caminadora Curva (Assault Runner)', typical: false,
    brand: 'Assault Fitness',
    dimensions: '200cm largo x 90cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Cardio Caminadoras'
  },
  { name: 'Caminadora con Inclinación Automática', typical: false,
    brand: 'Matrix',
    dimensions: '210cm largo x 95cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 180,
    status: 'Operacional',
    zone: 'Área Cardio Caminadoras'
  },

  // Bicicletas
  { name: 'Bicicleta Estática Vertical', typical: true,
    brand: 'Technogym',
    dimensions: '120cm largo x 60cm ancho x 140cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Bicicletas'
  },
  { name: 'Bicicleta Reclinada (Recumbent)', typical: true,
    brand: 'Life Fitness',
    dimensions: '140cm largo x 65cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Cardio Bicicletas'
  },
  { name: 'Bicicleta de Spinning', typical: true,
    brand: 'Keiser',
    dimensions: '120cm largo x 60cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Bicicletas'
  },
  { name: 'Bicicleta Assault (Air Bike)', typical: false,
    brand: 'Assault Fitness',
    dimensions: '120cm largo x 60cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Bicicletas'
  },
  { name: 'Bicicleta Indoor Cycling Profesional', typical: false,
    brand: 'Technogym',
    dimensions: '120cm largo x 60cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Bicicletas'
  },

  // Escaladoras y Remo
  { name: 'Escaladora (Stair Climber)', typical: false,
    brand: 'Matrix',
    dimensions: '120cm largo x 90cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Cardio Escaladoras'
  },
  { name: 'Step Mill (Escaladora de Peldaños)', typical: false,
    brand: 'Life Fitness',
    dimensions: '120cm largo x 90cm ancho x 200cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Cardio Escaladoras'
  },
  { name: 'Remo Indoor (Concept2)', typical: false,
    brand: 'Concept2',
    dimensions: '240cm largo x 60cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Remo'
  },
  { name: 'SkiErg (Máquina de Esquí)', typical: false,
    brand: 'Concept2',
    dimensions: '120cm largo x 60cm ancho x 220cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Remo'
  },

  // Otros
  { name: 'Escalador Vertical (Versaclimber)', typical: false,
    brand: 'Versaclimber',
    dimensions: '120cm largo x 80cm ancho x 220cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Otros'
  },
  { name: 'Máquina de Remo de Agua', typical: false,
    brand: 'First Degree Fitness',
    dimensions: '240cm largo x 60cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Otros'
  },
  { name: 'Fan Bike (Bicicleta de Aire)', typical: false,
    brand: 'Assault Fitness',
    dimensions: '120cm largo x 60cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Cardio Otros'
  }
],

  
'functional': [
  // Core y Estabilidad
  { name: 'Rueda Abdominal (Ab Wheel)', typical: true,
    brand: 'Domyos',
    dimensions: '25cm diámetro rueda x 15cm ancho',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Funcional Core'
  },
  { name: 'Disco de Equilibrio', typical: false,
    brand: 'Bosu',
    dimensions: '40cm diámetro',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Funcional Core'
  },
  { name: 'Tabla de Equilibrio', typical: false,
    brand: 'Yes4All',
    dimensions: '80cm largo x 25cm ancho x 5cm alto',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Funcional Core'
  },
  { name: 'Foam Roller (Rodillo de Espuma)', typical: true,
    brand: 'TriggerPoint',
    dimensions: '30cm largo x 15cm diámetro',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Funcional Core'
  },
  { name: 'Pelota Lacrosse (Masaje)', typical: false,
    brand: 'RumbleRoller',
    dimensions: '7cm diámetro',
    weightRange: '0kg',
    maxWeight: 50,
    status: 'Operacional',
    zone: 'Área Funcional Core'
  },

  // Barras y Estructuras
  { name: 'Barra de Dominadas de Pared', typical: true,
    brand: 'York Fitness',
    dimensions: '120cm largo x 40cm ancho x 25cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Funcional Barras'
  },
  { name: 'Paralelas (Dip Station)', typical: true,
    brand: 'Body-Solid',
    dimensions: '100cm largo x 60cm ancho x 120cm alto',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Funcional Barras'
  },
  { name: 'Escalera de Agilidad', typical: false,
    brand: 'SKLZ',
    dimensions: '400cm largo x 50cm ancho',
    weightRange: '0kg',
    maxWeight: 50,
    status: 'Operacional',
    zone: 'Área Funcional Barras'
  },
  { name: 'Conos de Entrenamiento (Set 10)', typical: false,
    brand: 'Nike',
    dimensions: '25cm alto x 20cm base',
    weightRange: '0kg',
    maxWeight: 20,
    status: 'Operacional',
    zone: 'Área Funcional Barras'
  },
  { name: 'Vallas de Entrenamiento', typical: false,
    brand: 'Adidas',
    dimensions: '60cm ancho x 40cm alto',
    weightRange: '0kg',
    maxWeight: 20,
    status: 'Operacional',
    zone: 'Área Funcional Barras'
  },

  // Accesorios
  { name: 'Guantes de Entrenamiento', typical: false,
    brand: 'Reebok',
    dimensions: 'Tallas S, M, L',
    weightRange: '0kg',
    maxWeight: 0,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Straps de Levantamiento', typical: false,
    brand: 'Harbinger',
    dimensions: '50cm largo x 5cm ancho',
    weightRange: '0kg',
    maxWeight: 0,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Cinturón de Lastre', typical: false,
    brand: 'RDX',
    dimensions: 'Ajustable 70-120cm',
    weightRange: '0kg',
    maxWeight: 50,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Cinturón Lumbar', typical: true,
    brand: 'Rogue',
    dimensions: 'Ajustable 70-120cm',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Muñequeras', typical: false,
    brand: 'Adidas',
    dimensions: 'S, M, L',
    weightRange: '0kg',
    maxWeight: 50,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Rodilleras', typical: false,
    brand: 'Nike',
    dimensions: 'S, M, L',
    weightRange: '0kg',
    maxWeight: 50,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Grips para Dominadas', typical: false,
    brand: 'Rogue',
    dimensions: '15cm largo x 5cm ancho',
    weightRange: '0kg',
    maxWeight: 50,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Cuerda para Triceps (Cable)', typical: true,
    brand: 'Body-Solid',
    dimensions: '50cm largo x 2.5cm diámetro',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Barra Recta para Cable', typical: true,
    brand: 'Harbinger',
    dimensions: '120cm largo x 3cm diámetro',
    weightRange: '0kg',
    maxWeight: 120,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Barra V para Cable', typical: true,
    brand: 'Harbinger',
    dimensions: '60cm largo x 3cm diámetro',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Manijas para Poleas (par)', typical: true,
    brand: 'Body-Solid',
    dimensions: '25cm largo x 5cm ancho',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },
  { name: 'Correa de Tobillo para Cable', typical: false,
    brand: 'Adidas',
    dimensions: 'Ajustable 25-45cm',
    weightRange: '0kg',
    maxWeight: 50,
    status: 'Operacional',
    zone: 'Área Funcional Accesorios'
  },

  // Sandbags y Bulgarian Bags
  { name: 'Sandbag 10kg', typical: false,
    brand: 'Rogue',
    dimensions: '50cm largo x 25cm ancho',
    weightRange: '10kg',
    maxWeight: 10,
    status: 'Operacional',
    zone: 'Área Funcional Sandbags'
  },
  { name: 'Sandbag 20kg', typical: false,
    brand: 'Rogue',
    dimensions: '50cm largo x 25cm ancho',
    weightRange: '20kg',
    maxWeight: 20,
    status: 'Operacional',
    zone: 'Área Funcional Sandbags'
  },
  { name: 'Sandbag 30kg', typical: false,
    brand: 'Rogue',
    dimensions: '50cm largo x 25cm ancho',
    weightRange: '30kg',
    maxWeight: 30,
    status: 'Operacional',
    zone: 'Área Funcional Sandbags'
  },
  { name: 'Bulgarian Bag 8kg', typical: false,
    brand: 'Power Systems',
    dimensions: '60cm largo x 25cm diámetro',
    weightRange: '8kg',
    maxWeight: 8,
    status: 'Operacional',
    zone: 'Área Funcional Sandbags'
  },
  { name: 'Bulgarian Bag 12kg', typical: false,
    brand: 'Power Systems',
    dimensions: '60cm largo x 25cm diámetro',
    weightRange: '12kg',
    maxWeight: 12,
    status: 'Operacional',
    zone: 'Área Funcional Sandbags'
  },

  // CrossFit Específico
  { name: 'Barras Paralelas (Parallettes)', typical: false,
    brand: 'Rogue',
    dimensions: '30cm largo x 25cm ancho x 20cm alto',
    weightRange: '0kg',
    maxWeight: 100,
    status: 'Operacional',
    zone: 'Área Funcional CrossFit'
  },
  { name: 'J-Hooks para Rack', typical: false,
    brand: 'Rogue',
    dimensions: '30cm largo x 15cm ancho',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Funcional CrossFit'
  },
  { name: 'Safety Spotter Arms', typical: false,
    brand: 'Rogue',
    dimensions: '120cm largo x 5cm ancho',
    weightRange: '0kg',
    maxWeight: 200,
    status: 'Operacional',
    zone: 'Área Funcional CrossFit'
  },
  { name: 'Landmine (Base para Barra)', typical: false,
    brand: 'Titan Fitness',
    dimensions: '20cm diámetro base x 30cm altura',
    weightRange: '0kg',
    maxWeight: 150,
    status: 'Operacional',
    zone: 'Área Funcional CrossFit'
  },
  { name: 'Bumper Plate Storage', typical: false,
    brand: 'Rogue',
    dimensions: '60cm diámetro x 100cm alto',
    weightRange: '0kg',
    maxWeight: 400,
    status: 'Operacional',
    zone: 'Área Funcional CrossFit'
  }
],
};

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private equipmentSubject = new BehaviorSubject<GymEquipment[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  equipment$ = this.equipmentSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private db: AngularFirestore) {
    console.log('🏋️ EquipmentService inicializado');
    this.loadEquipment();
  }

  private loadEquipment(): void {
    this.isLoadingSubject.next(true);
    console.log('🏋️ Cargando equipamiento desde Firebase...');

    this.db.collection('gymEquipment').valueChanges({ idField: 'id' }).pipe(
      map((equipment: any[]) => {
        console.log(`✅ ${equipment.length} equipos cargados desde Firebase`);
        return equipment.map(eq => this.mapFirebaseToEquipment(eq));
      }),
      catchError(error => {
        console.error('❌ Error cargando equipamiento:', error);
        return of([]);
      }),
      startWith([])
    ).subscribe(equipment => {
      this.equipmentSubject.next(equipment);
      this.isLoadingSubject.next(false);
    });
  }

  private mapFirebaseToEquipment(doc: any): GymEquipment {
    return {
      id: doc.id || doc.equipmentId,
      category: doc.category || 'free-weights',
      name: doc.name || '',
      brand: doc.brand || undefined,
      quantity: doc.quantity || 1,
      status: doc.status || 'operational',
      zone: doc.zone || '',
      purchaseDate: doc.purchaseDate?.toDate?.() || undefined,
      lastMaintenance: doc.lastMaintenance?.toDate?.() || undefined,
      nextMaintenanceDate: doc.nextMaintenanceDate?.toDate?.() || undefined,
      cost: doc.cost || undefined,
      notes: doc.notes || '',
      imageUrl: doc.imageUrl || '',
      specifications: doc.specifications || {},
      usageStats: doc.usageStats || { totalUses: 0, averageUsesPerDay: 0 },
      createdAt: doc.createdAt?.toDate?.() || new Date(),
      updatedAt: doc.updatedAt?.toDate?.() || new Date(),
      updatedBy: doc.updatedBy || ''
    };
  }

  async addEquipment(equipment: Omit<GymEquipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('➕ Agregando nuevo equipo:', equipment.name);
      
      const newEquipment = {
        ...equipment,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // ✅ USAR FIREBASE DIRECTAMENTE COMO EN TUS OTROS SERVICIOS
      const docRef = await firebase.firestore().collection('gymEquipment').add(newEquipment);
      console.log('✅ Equipo agregado con ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando equipo:', error);
      throw error;
    }
  }

  async updateEquipment(id: string, updates: Partial<GymEquipment>): Promise<void> {
    try {
      console.log('✏️ Actualizando equipo:', id);
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      // ✅ USAR FIREBASE DIRECTAMENTE
      await firebase.firestore().collection('gymEquipment').doc(id).update(updateData);
      console.log('✅ Equipo actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando equipo:', error);
      throw error;
    }
  }

  async deleteEquipment(id: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando equipo:', id);
      // ✅ USAR FIREBASE DIRECTAMENTE
      await firebase.firestore().collection('gymEquipment').doc(id).delete();
      console.log('✅ Equipo eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando equipo:', error);
      throw error;
    }
  }

  getEquipmentStats(): Observable<any> {
    return this.equipment$.pipe(
      map(equipment => {
        const total = equipment.length;
        const byCategory = {
          'free-weights': equipment.filter(e => e.category === 'free-weights').length,
          'machines': equipment.filter(e => e.category === 'machines').length,
          'cardio': equipment.filter(e => e.category === 'cardio').length,
          'functional': equipment.filter(e => e.category === 'functional').length
        };
        const byStatus = {
          operational: equipment.filter(e => e.status === 'operational').length,
          maintenance: equipment.filter(e => e.status === 'maintenance').length,
          broken: equipment.filter(e => e.status === 'broken').length,
          reserved: equipment.filter(e => e.status === 'reserved').length
        };
        const needsMaintenance = equipment.filter(e => {
          if (!e.nextMaintenanceDate) return false;
          return e.nextMaintenanceDate < new Date();
        }).length;

        return { total, byCategory, byStatus, needsMaintenance };
      })
    );
  }

  filterEquipment(
    category?: string,
    status?: string,
    zone?: string,
    searchTerm?: string
  ): Observable<GymEquipment[]> {
    return this.equipment$.pipe(
      map(equipment => {
        let filtered = [...equipment];

        if (category && category !== 'all') {
          filtered = filtered.filter(e => e.category === category);
        }

        if (status && status !== 'all') {
          filtered = filtered.filter(e => e.status === status);
        }

        if (zone && zone !== 'all') {
          filtered = filtered.filter(e => e.zone === zone);
        }

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(e => 
            e.name.toLowerCase().includes(term) ||
            e.brand?.toLowerCase().includes(term) ||
            e.notes?.toLowerCase().includes(term)
          );
        }

        return filtered;
      })
    );
  }

  async markForMaintenance(id: string, nextDate: Date, updatedBy: string): Promise<void> {
    try {
      await this.updateEquipment(id, {
        status: 'maintenance',
        nextMaintenanceDate: nextDate,
        lastMaintenance: new Date(),
        updatedBy
      });
      console.log('✅ Equipo marcado para mantenimiento');
    } catch (error) {
      console.error('❌ Error marcando mantenimiento:', error);
      throw error;
    }
  }

  async completeMaintenanceAndMarkOperational(id: string, updatedBy: string): Promise<void> {
    try {
      await this.updateEquipment(id, {
        status: 'operational',
        lastMaintenance: new Date(),
        updatedBy
      });
      console.log('✅ Mantenimiento completado, equipo operacional');
    } catch (error) {
      console.error('❌ Error completando mantenimiento:', error);
      throw error;
    }
  }

  getEquipmentCatalog() {
    return EQUIPMENT_CATALOG;
  }

  getCategoryOptions() {
    return [
      { value: 'free-weights', label: 'Peso Libre', icon: 'fitness_center' },
      { value: 'machines', label: 'Máquinas', icon: 'settings_input_composite' },
      { value: 'cardio', label: 'Cardio', icon: 'directions_run' },
      { value: 'functional', label: 'Funcional', icon: 'self_improvement' }
    ];
  }

  getStatusOptions() {
    return [
      { value: 'operational', label: 'Operacional', color: '#10b981' },
      { value: 'maintenance', label: 'Mantenimiento', color: '#f59e0b' },
      { value: 'broken', label: 'Averiado', color: '#ef4444' },
      { value: 'reserved', label: 'Reservado', color: '#3b82f6' }
    ];
  }
}
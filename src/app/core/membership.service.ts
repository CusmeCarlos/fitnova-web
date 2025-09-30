// src/app/core/membership.service.ts
// 💳 SERVICIO DE GESTIÓN DE MEMBRESÍAS - DATOS REALES FIREBASE

import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators';
import { MembershipPlan, UserMembership } from '../interfaces/gym-management.interface';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private plansSubject = new BehaviorSubject<MembershipPlan[]>([]);
  private membershipsSubject = new BehaviorSubject<UserMembership[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  plans$ = this.plansSubject.asObservable();
  memberships$ = this.membershipsSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private db: AngularFirestore) {
    console.log('💳 MembershipService inicializado');
    this.loadPlans();
    this.loadMemberships();
  }

  // ================================================================================
  // 📋 GESTIÓN DE PLANES
  // ================================================================================

  private loadPlans(): void {
    this.isLoadingSubject.next(true);
    console.log('💳 Cargando planes de membresía desde Firebase...');

    this.db.collection('membershipPlans').valueChanges({ idField: 'id' }).pipe(
      map((plans: any[]) => {
        console.log(`✅ ${plans.length} planes cargados desde Firebase`);
        return plans.map(plan => this.mapFirebaseToPlan(plan));
      }),
      catchError(error => {
        console.error('❌ Error cargando planes:', error);
        return of([]);
      }),
      startWith([])
    ).subscribe(plans => {
      this.plansSubject.next(plans);
      this.isLoadingSubject.next(false);
    });
  }

  private mapFirebaseToPlan(doc: any): MembershipPlan {
    return {
      id: doc.id || doc.planId,
      name: doc.name || '',
      description: doc.description || '',
      type: doc.type || 'monthly',
      price: doc.price || 0,
      currency: doc.currency || 'USD',
      discount: doc.discount || undefined,
      durationDays: doc.durationDays || 30,
      benefits: doc.benefits || {
        unlimitedAccess: false,
        peakHourAccess: false,
        routineGeneration: false,
        postureDetection: false,
        lockerIncluded: false,
        towelService: false,
        nutritionConsultation: false
      },
      targetAudience: doc.targetAudience || 'all',
      recommendedFor: doc.recommendedFor || [],
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      isPromoted: doc.isPromoted !== undefined ? doc.isPromoted : false,
      popularityRank: doc.popularityRank || 0,
      maxActiveMembers: doc.maxActiveMembers || undefined,
      currentActiveMembers: doc.currentActiveMembers || 0,
      autoRenewal: doc.autoRenewal !== undefined ? doc.autoRenewal : false,
      createdAt: doc.createdAt?.toDate?.() || new Date(),
      updatedAt: doc.updatedAt?.toDate?.() || new Date(),
      updatedBy: doc.updatedBy || ''
    };
  }

  async addPlan(plan: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt' | 'currentActiveMembers'>): Promise<string> {
    try {
      console.log('➕ Agregando nuevo plan:', plan.name);
      
      const newPlan = {
        ...plan,
        currentActiveMembers: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await firebase.firestore().collection('membershipPlans').add(newPlan);
      console.log('✅ Plan agregado con ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando plan:', error);
      throw error;
    }
  }

  async updatePlan(id: string, updates: Partial<MembershipPlan>): Promise<void> {
    try {
      console.log('✏️ Actualizando plan:', id);
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await firebase.firestore().collection('membershipPlans').doc(id).update(updateData);
      console.log('✅ Plan actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando plan:', error);
      throw error;
    }
  }

  async deletePlan(id: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando plan:', id);
      
      // Verificar que no haya membresías activas con este plan
      const activeMemberships = await firebase.firestore()
        .collection('userMemberships')
        .where('planId', '==', id)
        .where('status', '==', 'active')
        .get();

      if (!activeMemberships.empty) {
        throw new Error('No se puede eliminar un plan con membresías activas');
      }

      await firebase.firestore().collection('membershipPlans').doc(id).delete();
      console.log('✅ Plan eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando plan:', error);
      throw error;
    }
  }

  // ================================================================================
  // 👥 GESTIÓN DE MEMBRESÍAS DE USUARIOS
  // ================================================================================

  private loadMemberships(): void {
    console.log('💳 Cargando membresías de usuarios desde Firebase...');

    this.db.collection('userMemberships').valueChanges({ idField: 'id' }).pipe(
      map((memberships: any[]) => {
        console.log(`✅ ${memberships.length} membresías cargadas desde Firebase`);
        return memberships.map(m => this.mapFirebaseToMembership(m));
      }),
      catchError(error => {
        console.error('❌ Error cargando membresías:', error);
        return of([]);
      }),
      startWith([])
    ).subscribe(memberships => {
      this.membershipsSubject.next(memberships);
    });
  }

  private mapFirebaseToMembership(doc: any): UserMembership {
    return {
      id: doc.id || doc.membershipId,
      userId: doc.userId || '',
      planId: doc.planId || '',
      status: doc.status || 'pending-payment',
      startDate: doc.startDate?.toDate?.() || new Date(),
      endDate: doc.endDate?.toDate?.() || new Date(),
      purchaseDate: doc.purchaseDate?.toDate?.() || new Date(),
      frozenDays: doc.frozenDays || 0,
      freezeHistory: doc.freezeHistory || [],
      totalVisits: doc.totalVisits || 0,
      visitsThisMonth: doc.visitsThisMonth || 0,
      visitsThisWeek: doc.visitsThisWeek || 0,
      lastVisit: doc.lastVisit?.toDate?.() || undefined,
      averageVisitsPerWeek: doc.averageVisitsPerWeek || 0,
      paymentMethod: doc.paymentMethod || 'pending',
      paymentHistory: (doc.paymentHistory || []).map((p: any) => ({
        ...p,
        date: p.date?.toDate?.() || new Date()
      })),
      autoRenewalEnabled: doc.autoRenewalEnabled || false,
      createdAt: doc.createdAt?.toDate?.() || new Date(),
      updatedAt: doc.updatedAt?.toDate?.() || new Date()
    };
  }

  async assignMembership(
    userId: string, 
    planId: string, 
    paymentMethod: 'cash' | 'card' | 'transfer',
    processedBy: string
  ): Promise<string> {
    try {
      console.log('➕ Asignando membresía a usuario:', userId);

      // Obtener plan para calcular fecha de fin
      const planDoc = await firebase.firestore().collection('membershipPlans').doc(planId).get();
      if (!planDoc.exists) {
        throw new Error('Plan no encontrado');
      }

      const plan = planDoc.data() as MembershipPlan;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);

      const newMembership: Omit<UserMembership, 'id'> = {
        userId,
        planId,
        status: 'active',
        startDate,
        endDate,
        purchaseDate: startDate,
        frozenDays: 0,
        freezeHistory: [],
        totalVisits: 0,
        visitsThisMonth: 0,
        visitsThisWeek: 0,
        averageVisitsPerWeek: 0,
        paymentMethod,
        paymentHistory: [{
          date: new Date(),
          amount: plan.price,
          method: paymentMethod,
          processedBy
        }],
        autoRenewalEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await firebase.firestore().collection('userMemberships').add(newMembership);
      
      // Actualizar contador de miembros activos del plan
      await firebase.firestore().collection('membershipPlans').doc(planId).update({
        currentActiveMembers: firebase.firestore.FieldValue.increment(1)
      });

      console.log('✅ Membresía asignada con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error asignando membresía:', error);
      throw error;
    }
  }

  async renewMembership(
    membershipId: string,
    paymentMethod: 'cash' | 'card' | 'transfer',
    processedBy: string
  ): Promise<void> {
    try {
      console.log('🔄 Renovando membresía:', membershipId);

      const membershipDoc = await firebase.firestore().collection('userMemberships').doc(membershipId).get();
      if (!membershipDoc.exists) {
        throw new Error('Membresía no encontrada');
      }

      const membership = this.mapFirebaseToMembership(membershipDoc.data());
      
      // Obtener plan para calcular nueva fecha de fin
      const planDoc = await firebase.firestore().collection('membershipPlans').doc(membership.planId).get();
      if (!planDoc.exists) {
        throw new Error('Plan no encontrado');
      }

      const plan = this.mapFirebaseToPlan(planDoc.data());
      
      // Calcular nueva fecha de fin desde la fecha actual o desde el endDate si aún está activa
      const now = new Date();
      const baseDate = membership.endDate > now ? membership.endDate : now;
      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + plan.durationDays);

      // Agregar pago al historial
      const newPayment = {
        date: new Date(),
        amount: plan.price,
        method: paymentMethod,
        processedBy
      };

      await firebase.firestore().collection('userMemberships').doc(membershipId).update({
        status: 'active',
        endDate: newEndDate,
        paymentHistory: firebase.firestore.FieldValue.arrayUnion(newPayment),
        updatedAt: new Date()
      });

      console.log('✅ Membresía renovada correctamente hasta:', newEndDate);
    } catch (error) {
      console.error('❌ Error renovando membresía:', error);
      throw error;
    }
  }

  async cancelMembership(membershipId: string): Promise<void> {
    try {
      console.log('❌ Cancelando membresía:', membershipId);

      const membershipDoc = await firebase.firestore().collection('userMemberships').doc(membershipId).get();
      if (!membershipDoc.exists) {
        throw new Error('Membresía no encontrada');
      }

      const membership = this.mapFirebaseToMembership(membershipDoc.data());

      await firebase.firestore().collection('userMemberships').doc(membershipId).update({
        status: 'cancelled',
        updatedAt: new Date()
      });

      // Decrementar contador de miembros activos del plan
      await firebase.firestore().collection('membershipPlans').doc(membership.planId).update({
        currentActiveMembers: firebase.firestore.FieldValue.increment(-1)
      });

      console.log('✅ Membresía cancelada correctamente');
    } catch (error) {
      console.error('❌ Error cancelando membresía:', error);
      throw error;
    }
  }

  async freezeMembership(
    membershipId: string,
    days: number,
    reason: string,
    approvedBy: string
  ): Promise<void> {
    try {
      console.log('🧊 Congelando membresía:', membershipId);

      const membershipDoc = await firebase.firestore().collection('userMemberships').doc(membershipId).get();
      if (!membershipDoc.exists) {
        throw new Error('Membresía no encontrada');
      }

      const membership = this.mapFirebaseToMembership(membershipDoc.data());
      
      // Extender fecha de fin
      const newEndDate = new Date(membership.endDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const freezeRecord = {
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        reason,
        approvedBy
      };

      await firebase.firestore().collection('userMemberships').doc(membershipId).update({
        endDate: newEndDate,
        frozenDays: membership.frozenDays + days,
        freezeHistory: firebase.firestore.FieldValue.arrayUnion(freezeRecord),
        updatedAt: new Date()
      });

      console.log('✅ Membresía congelada por', days, 'días');
    } catch (error) {
      console.error('❌ Error congelando membresía:', error);
      throw error;
    }
  }

  // ================================================================================
  // 📊 ESTADÍSTICAS Y REPORTES
  // ================================================================================

  getMembershipStats(): Observable<any> {
    return combineLatest([this.plans$, this.memberships$]).pipe(
      map(([plans, memberships]) => {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const activeMemberships = memberships.filter(m => m.status === 'active');
        const expiringSoon = activeMemberships.filter(m => 
          m.endDate <= sevenDaysFromNow && m.endDate >= now
        );
        const expired = memberships.filter(m => m.status === 'expired');

        // Calcular ingresos del mes actual
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthlyRevenue = memberships.reduce((total, m) => {
          return total + m.paymentHistory
            .filter(p => {
              const paymentDate = new Date(p.date);
              return paymentDate.getMonth() === currentMonth && 
                     paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + p.amount, 0);
        }, 0);

        // Calcular tasa de renovación
        const renewalRate = expired.length > 0 
          ? (activeMemberships.length / (activeMemberships.length + expired.length)) * 100 
          : 100;

        // Plan más popular
        const planCounts = activeMemberships.reduce((acc, m) => {
          acc[m.planId] = (acc[m.planId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostPopularPlanId = Object.entries(planCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0];
        const mostPopularPlan = plans.find(p => p.id === mostPopularPlanId);

        // Usuarios sin membresía (este dato vendrá del user service)
        const usersWithMembership = new Set(memberships.map(m => m.userId)).size;

        return {
          totalActive: activeMemberships.length,
          expiringSoon: expiringSoon.length,
          expired: expired.length,
          monthlyRevenue,
          renewalRate: renewalRate.toFixed(1),
          mostPopularPlan: mostPopularPlan?.name || 'N/A',
          usersWithMembership,
          totalPlans: plans.length,
          activePlans: plans.filter(p => p.isActive).length
        };
      })
    );
  }

  getRevenueByMonth(months: number = 6): Observable<any[]> {
    return this.memberships$.pipe(
      map(memberships => {
        const now = new Date();
        const monthlyData: any[] = [];

        for (let i = months - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const month = date.getMonth();
          const year = date.getFullYear();

          const revenue = memberships.reduce((total, m) => {
            return total + m.paymentHistory
              .filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate.getMonth() === month && 
                       paymentDate.getFullYear() === year;
              })
              .reduce((sum, p) => sum + p.amount, 0);
          }, 0);

          monthlyData.push({
            month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
            revenue
          });
        }

        return monthlyData;
      })
    );
  }

  getUserMembership(userId: string): Observable<UserMembership | null> {
    return this.memberships$.pipe(
      map(memberships => {
        const userMemberships = memberships.filter(m => m.userId === userId);
        
        // Retornar la membresía activa o la más reciente
        const active = userMemberships.find(m => m.status === 'active');
        if (active) return active;

        // Si no hay activa, retornar la más reciente
        return userMemberships.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        )[0] || null;
      })
    );
  }

  // ================================================================================
  // 🔧 UTILIDADES
  // ================================================================================

  getDaysRemaining(endDate: Date): number {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isExpired(endDate: Date): boolean {
    return endDate < new Date();
  }

  isExpiringSoon(endDate: Date, daysThreshold: number = 7): boolean {
    const daysRemaining = this.getDaysRemaining(endDate);
    return daysRemaining > 0 && daysRemaining <= daysThreshold;
  }

  async checkAndUpdateExpiredMemberships(): Promise<void> {
    try {
      console.log('🔍 Verificando membresías vencidas...');

      const snapshot = await firebase.firestore()
        .collection('userMemberships')
        .where('status', '==', 'active')
        .get();

      const batch = firebase.firestore().batch();
      let count = 0;

      snapshot.forEach(doc => {
        const membership = this.mapFirebaseToMembership(doc.data());
        if (this.isExpired(membership.endDate)) {
          batch.update(doc.ref, {
            status: 'expired',
            updatedAt: new Date()
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`✅ ${count} membresías marcadas como vencidas`);
      } else {
        console.log('✅ No hay membresías vencidas');
      }
    } catch (error) {
      console.error('❌ Error verificando membresías vencidas:', error);
    }
  }
}
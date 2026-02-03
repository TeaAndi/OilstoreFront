import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { add, createOutline, trashOutline, checkmarkCircle } from 'ionicons/icons';

export type ActivityType = 'create' | 'update' | 'delete';

export interface Activity {
  title: string;
  time: string; // ISO string for sorting/persistence
  type: ActivityType;
  icon: any; // ionicon definition or name
}

const STORAGE_KEY = 'admin_recent_activity';
const MAX_ITEMS = 20;

const SEED_ACTIVITIES: Activity[] = [
  {
    title: 'Producto creado por Jeffox',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    type: 'create',
    icon: add,
  },
  {
    title: 'Inventario ajustado por Jeffox',
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: 'update',
    icon: checkmarkCircle,
  },
];

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private activitiesSubject = new BehaviorSubject<Activity[]>(this.loadFromStorage());
  activities$ = this.activitiesSubject.asObservable();

  constructor() {
    // Sync across tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        const data = this.loadFromStorage();
        this.activitiesSubject.next(data);
      }
    });
  }

  add(activity: Omit<Activity, 'time'> & { time?: string }) {
    const now = activity.time ?? new Date().toISOString();
    const next: Activity = { ...activity, time: now };
    const list = [next, ...this.activitiesSubject.value].slice(0, MAX_ITEMS);
    this.activitiesSubject.next(list);
    this.saveToStorage(list);
  }

  getRelativeTime(isoTime: string): string {
    const now = Date.now();
    const time = new Date(isoTime).getTime();
    const diffMs = now - time;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Hace unos segundos';
    if (diffMin < 60) return `Hace ${diffMin}m`;
    if (diffHour < 24) return `Hace ${diffHour}h`;
    return `Hace ${diffDay}d`;
  }

  private loadFromStorage(): Activity[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return SEED_ACTIVITIES;
      const parsed = JSON.parse(raw) as Activity[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ACTIVITIES;
    } catch (e) {
      console.warn('No se pudo leer actividad reciente de storage', e);
      return SEED_ACTIVITIES;
    }
  }

  private saveToStorage(list: Activity[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('No se pudo guardar actividad reciente en storage', e);
    }
  }
}

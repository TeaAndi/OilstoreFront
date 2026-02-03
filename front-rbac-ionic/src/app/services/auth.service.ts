import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export type DbRole = 'db_datareader' | 'db_datawriter' | 'db_owner' | 'public';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.post<any>(
      `${this.baseUrl}/auth/login`,
      { username, password },
      { headers }
    ).pipe(
      tap((res) => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user)); // { username, dbRole }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get user(): { username: string; dbRole: DbRole } | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  get dbRole(): DbRole | null {
    return this.user?.dbRole ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  isOwner(): boolean {
    return this.dbRole === 'db_owner';
  }
  isSa(): boolean {
      return (this.user?.username ?? '').toLowerCase() === 'sa';
    }

  canWrite(): boolean {
    return this.dbRole === 'db_datawriter' || this.dbRole === 'db_owner';
  }

  canRead(): boolean {
    return this.dbRole === 'db_datareader' || this.dbRole === 'db_datawriter' || this.dbRole === 'db_owner';
  }
}

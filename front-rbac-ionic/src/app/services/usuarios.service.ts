import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DbRole = 'db_datareader' | 'db_datawriter' | 'db_owner';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private baseUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api';

  constructor(private http: HttpClient) {}

  crearLogin(username: string, password: string, dbRole: DbRole): Observable<any> {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.post<any>(`${this.baseUrl}/usuarios/crear-login`, {
      username,
      password,
      dbRole,
    }, { headers });
  }
}

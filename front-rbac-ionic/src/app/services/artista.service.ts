import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Artista {
  Identificador_Artista: string;        // nvarchar(6) PK
  Cedula_Artista?: string | null;       // nvarchar(15)
  Nombre_Artista?: string | null;       // nvarchar(30)
  Apellido_Artista?: string | null;     // nvarchar(30)
  Tipo_Artista?: string | null;         // nvarchar(30)
  Pais_Origen_Artista?: string | null;  // nvarchar(40)
}

@Injectable({ providedIn: 'root' })
export class ArtistaService {
  private baseUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.get<any>(`${this.baseUrl}/artista`, { headers });
  }

  create(data: Partial<Artista>): Observable<any> {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.post<any>(`${this.baseUrl}/artista`, data, { headers });
  }

  update(id: string, data: Partial<Artista>): Observable<any> {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.put<any>(`${this.baseUrl}/artista/${id}`, data, { headers });
  }

  remove(id: string): Observable<any> {
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    return this.http.delete<any>(`${this.baseUrl}/artista/${id}`, { headers });
  }
}

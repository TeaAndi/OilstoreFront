import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { save, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';

interface Vendedor {
  Id_Vendedor: string;
  Nombre_Vendedor: string;
  Direccion_Vendedor: string;
  Telefono_Vendedor: string;
  Correo_Vendedor: string;
}

@Component({
  selector: 'app-vendedor-form-modal',
  templateUrl: './vendedor-form-modal.component.html',
  styleUrls: ['./vendedor-form-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class VendedorFormModalComponent implements OnInit {
  @Input() token: string = '';
  @Input() vendedor?: Vendedor;
  @Input() isEdit: boolean = false;

  nuevoVendedor: Vendedor = {
    Id_Vendedor: '',
    Nombre_Vendedor: '',
    Direccion_Vendedor: '',
    Telefono_Vendedor: '',
    Correo_Vendedor: '',
  };

  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/vendedor';

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private toastController: ToastController
  ) {
    addIcons({ 'save': save, 'checkmark-circle': checkmarkCircle, 'alert-circle': alertCircle, 'close-outline': closeOutline });
  }

  ngOnInit() {
    if (this.isEdit && this.vendedor) {
      this.nuevoVendedor = { ...this.vendedor } as Vendedor;
    }
  }

  guardarVendedor() {
    if (!this.nuevoVendedor.Nombre_Vendedor) {
      this.mostrarToast('El nombre del vendedor es obligatorio', 'danger');
      return;
    }

    const headers = { Authorization: `Bearer ${this.token}` };
    const body = {
      Nombre_Vendedor: this.nuevoVendedor.Nombre_Vendedor,
      Direccion_Vendedor: this.nuevoVendedor.Direccion_Vendedor || null,
      Telefono_Vendedor: this.nuevoVendedor.Telefono_Vendedor || null,
      Correo_Vendedor: this.nuevoVendedor.Correo_Vendedor || null,
    };

    if (this.isEdit && this.nuevoVendedor.Id_Vendedor) {
      this.http.put<any>(`${this.apiUrl}/${encodeURIComponent(this.nuevoVendedor.Id_Vendedor)}`, body, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`"${response.data.Nombre_Vendedor}" actualizado correctamente`, 'success');
            setTimeout(() => { this.modalController.dismiss({ action: 'updated', data: response.data }); }, 1500);
          }
        },
        error: (error) => {
          this.mostrarToast('Error actualizando el vendedor', 'danger');
        }
      });
    } else {
      this.http.post<any>(this.apiUrl, body, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`"${response.data.Nombre_Vendedor}" creado con ID: ${response.data.Id_Vendedor}`, 'success');
            setTimeout(() => { this.modalController.dismiss({ action: 'created', data: response.data }); }, 1500);
          }
        },
        error: (error) => {
          this.mostrarToast('Error guardando el vendedor', 'danger');
        }
      });
    }
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'danger') {
    const toast = await this.toastController.create({ message: mensaje, duration: 3000, position: 'bottom', color: color, icon: color === 'success' ? 'checkmark-circle' : 'close-outline', buttons: [{ text: 'Cerrar', role: 'cancel' }] });
    await toast.present();
  }

  cancelar() { this.modalController.dismiss(); }
}

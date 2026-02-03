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
  selector: 'app-vendedor-form-modal-admin',
  templateUrl: './vendedor-form-modal.component.html',
  styleUrls: ['./vendedor-form-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class VendedorFormModalComponent implements OnInit {
  @Input() token = '';
  @Input() vendedor?: Vendedor;
  @Input() isEdit = false;

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

    const headers = { Authorization: `Bearer ${this.token}`, 'ngrok-skip-browser-warning': 'true' };
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
            this.mostrarToast(`"${response.data.Nombre_Vendedor}" actualizado`, 'success');
            setTimeout(() => { this.modalController.dismiss({ action: 'updated', data: response.data }); }, 1000);
          }
        },
        error: () => this.mostrarToast('Error actualizando el vendedor', 'danger')
      });
    } else {
      this.http.post<any>(this.apiUrl, body, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`"${response.data.Nombre_Vendedor}" creado`, 'success');
            setTimeout(() => { this.modalController.dismiss({ action: 'created', data: response.data }); }, 1000);
          }
        },
        error: () => this.mostrarToast('Error guardando el vendedor', 'danger')
      });
    }
  }

  cancelar() {
    this.modalController.dismiss();
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color,
      icon: color === 'success' ? 'checkmark-circle' : 'close-outline',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }
}

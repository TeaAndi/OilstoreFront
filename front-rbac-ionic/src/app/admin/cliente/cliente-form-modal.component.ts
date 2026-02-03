import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { save, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';

interface Cliente {
  Id_Cliente: string;
  Nombre_Cliente: string;
  Direccion_Cliente: string;
  Telefono_Cliente: string;
  Correo_Cliente: string;
}

@Component({
  selector: 'app-cliente-form-modal-admin',
  templateUrl: './cliente-form-modal.component.html',
  styleUrls: ['./cliente-form-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ClienteFormModalComponent implements OnInit {
  @Input() token: string = '';
  @Input() cliente?: Cliente;
  @Input() isEdit: boolean = false;

  nuevoCliente: Cliente = {
    Id_Cliente: '',
    Nombre_Cliente: '',
    Direccion_Cliente: '',
    Telefono_Cliente: '',
    Correo_Cliente: '',
  };

  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/cliente';

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private toastController: ToastController
  ) {
    addIcons({
      'save': save,
      'checkmark-circle': checkmarkCircle,
      'alert-circle': alertCircle,
      'close-outline': closeOutline
    });
  }

  ngOnInit() {
    if (this.isEdit && this.cliente) {
      this.nuevoCliente = { ...this.cliente } as Cliente;
    }
  }

  guardarCliente() {
    if (!this.nuevoCliente.Nombre_Cliente) {
      this.mostrarToast('El nombre del cliente es obligatorio', 'danger');
      return;
    }

    const headers = { Authorization: `Bearer ${this.token}`, 'ngrok-skip-browser-warning': 'true' };
    const body = {
      Nombre_Cliente: this.nuevoCliente.Nombre_Cliente,
      Direccion_Cliente: this.nuevoCliente.Direccion_Cliente || null,
      Telefono_Cliente: this.nuevoCliente.Telefono_Cliente || null,
      Correo_Cliente: this.nuevoCliente.Correo_Cliente || null,
    };

    if (this.isEdit && this.nuevoCliente.Id_Cliente) {
      // Actualizar
      this.http.put<any>(`${this.apiUrl}/${encodeURIComponent(this.nuevoCliente.Id_Cliente)}`, body, { headers }).subscribe({
        next: (response) => {
          console.log('Editar Cliente OK', { status: 200, ...response });
          if (response.ok) {
            this.mostrarToast(`"${response.data.Nombre_Cliente}" actualizado correctamente`, 'success');
            setTimeout(() => {
              this.modalController.dismiss({ action: 'updated', data: response.data });
            }, 1500);
          }
        },
        error: (error) => {
          console.error('Editar Cliente ERROR', { status: error.status, error });
          this.mostrarToast('Error actualizando el cliente', 'danger');
        }
      });
    } else {
      // Crear
      this.http.post<any>(this.apiUrl, body, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`"${response.data.Nombre_Cliente}" creado con ID: ${response.data.Id_Cliente}`, 'success');
            setTimeout(() => {
              this.modalController.dismiss({ action: 'created', data: response.data });
            }, 1500);
          }
        },
        error: (error) => {
          console.error('Error guardando cliente:', error);
          this.mostrarToast('Error guardando el cliente', 'danger');
        }
      });
    }
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color,
      icon: color === 'success' ? 'checkmark-circle' : 'close-outline',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  cancelar() {
    this.modalController.dismiss();
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { save, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';

interface Producto {
  Id_Producto: string;
  Nombre_Producto: string;
  Descripcion_Producto: string;
  Stock_Producto: number;
  Valor_Producto: number;
  Unidad_Medida: string;
}

@Component({
  selector: 'app-producto-form-modal',
  templateUrl: './producto-form-modal.component.html',
  styleUrls: ['./producto-form-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProductoFormModalComponent implements OnInit {
  @Input() token: string = '';
  @Input() producto?: Producto; // Producto existente para edición
  @Input() isEdit: boolean = false;

  nuevoProducto: Producto = {
    Id_Producto: '',
    Nombre_Producto: '',
    Descripcion_Producto: '',
    Stock_Producto: 0,
    Valor_Producto: 0,
    Unidad_Medida: '',
  };

  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/producto';

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
    if (this.isEdit && this.producto) {
      // Prefill con el producto existente
      this.nuevoProducto = { ...this.producto } as Producto;
    }
  }

  guardarProducto() {
    if (!this.nuevoProducto.Nombre_Producto) {
      this.mostrarToast('El nombre del producto es obligatorio', 'danger');
      return;
    }

    const headers = { Authorization: `Bearer ${this.token}` };
    const body = {
      Nombre_Producto: this.nuevoProducto.Nombre_Producto,
      Descripcion_Producto: this.nuevoProducto.Descripcion_Producto || null,
      Stock_Producto: this.nuevoProducto.Stock_Producto || 0,
      Valor_Producto: this.nuevoProducto.Valor_Producto || 0,
      Unidad_Medida: this.nuevoProducto.Unidad_Medida || null,
    };

    if (this.isEdit && this.nuevoProducto.Id_Producto) {
      // Actualizar
      this.http.put<any>(`${this.apiUrl}/${encodeURIComponent(this.nuevoProducto.Id_Producto)}`, body, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`"${response.data.Nombre_Producto}" actualizado correctamente`, 'success');
            setTimeout(() => {
              this.modalController.dismiss({ action: 'updated', data: response.data });
            }, 1500);
          }
        },
        error: (error) => {
          console.error('Error actualizando producto:', error);
          this.mostrarToast('Error actualizando el producto', 'danger');
        }
      });
    } else {
      // Crear
      this.http.post<any>(this.apiUrl, body, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`"${response.data.Nombre_Producto}" creado con ID: ${response.data.Id_Producto}`, 'success');
            setTimeout(() => {
              this.modalController.dismiss({ action: 'created', data: response.data });
            }, 1500);
          }
        },
        error: (error) => {
          console.error('Error guardando producto:', error);
          this.mostrarToast('Error guardando el producto', 'danger');
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

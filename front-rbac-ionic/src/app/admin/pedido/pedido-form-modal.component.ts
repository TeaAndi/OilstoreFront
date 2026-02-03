import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { save, checkmarkCircle, alertCircle, closeOutline, addCircleOutline, trashOutline } from 'ionicons/icons';

interface Pedido {
  Id_Pedido: string;
  Id_Cliente: string;
  Id_Vendedor: string;
  Subtotal_Pedido: number;
  IVA: number;
  Total_Pedido: number;
}

interface Cliente {
  Id_Cliente: string;
  Nombre_Cliente: string;
}

interface Vendedor {
  Id_Vendedor: string;
  Nombre_Vendedor: string;
}

interface Producto {
  Id_Producto: string;
  Nombre_Producto: string;
  Valor_Producto: number;
}

interface DetallePedido {
  Id_Producto: string;
  Nombre_Producto?: string;
  Cantidad: number;
  ValorVenta: number;
  Descuento: number;
}

@Component({
  selector: 'app-pedido-form-modal-admin',
  templateUrl: './pedido-form-modal.component.html',
  styleUrls: ['./pedido-form-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PedidoFormModalAdminComponent implements OnInit {
  @Input() token = '';
  @Input() pedido?: Pedido;
  @Input() isEdit = false;

  nuevoPedido: Pedido = {
    Id_Pedido: '',
    Id_Cliente: '',
    Id_Vendedor: '',
    Subtotal_Pedido: 0,
    IVA: 0,
    Total_Pedido: 0
  };

  clientes: Cliente[] = [];
  vendedores: Vendedor[] = [];
  productos: Producto[] = [];
  detalles: DetallePedido[] = [];

  productoSeleccionado = '';
  cantidadSeleccionada = 1;

  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api';

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private toastController: ToastController
  ) {
    addIcons({
      'save': save,
      'checkmark-circle': checkmarkCircle,
      'alert-circle': alertCircle,
      'close-outline': closeOutline,
      'add-circle-outline': addCircleOutline,
      'trash-outline': trashOutline
    });
  }

  ngOnInit() {
    this.cargarCatalogos();
    if (this.isEdit && this.pedido) {
      this.nuevoPedido = { ...this.pedido } as Pedido;
    }
  }

  cargarCatalogos() {
    const headers = { Authorization: `Bearer ${this.token}` };

    this.http.get<any>(`${this.apiUrl}/cliente`, { headers }).subscribe({
      next: (response) => { if (response.ok) this.clientes = response.data; }
    });

    this.http.get<any>(`${this.apiUrl}/vendedor`, { headers }).subscribe({
      next: (response) => { if (response.ok) this.vendedores = response.data; }
    });

    this.http.get<any>(`${this.apiUrl}/producto`, { headers }).subscribe({
      next: (response) => { if (response.ok) this.productos = response.data; }
    });
  }

  agregarProducto() {
    if (!this.productoSeleccionado || this.cantidadSeleccionada < 1) {
      this.mostrarToast('Selecciona un producto y cantidad válida', 'danger');
      return;
    }

    const producto = this.productos.find(p => p.Id_Producto === this.productoSeleccionado);
    if (!producto) return;

    const valorVenta = this.cantidadSeleccionada * producto.Valor_Producto;
    const detalle: DetallePedido = {
      Id_Producto: producto.Id_Producto,
      Nombre_Producto: producto.Nombre_Producto,
      Cantidad: this.cantidadSeleccionada,
      ValorVenta: valorVenta,
      Descuento: 0
    };

    this.detalles.push(detalle);
    this.calcularTotal();
    this.productoSeleccionado = '';
    this.cantidadSeleccionada = 1;
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    const subtotal = this.detalles.reduce((sum, d) => sum + (d.ValorVenta - d.Descuento), 0);
    this.nuevoPedido.Subtotal_Pedido = subtotal;
    this.nuevoPedido.IVA = subtotal * 0.12;
    this.nuevoPedido.Total_Pedido = subtotal + this.nuevoPedido.IVA;
  }

  guardarPedido() {
    if (!this.nuevoPedido.Id_Cliente || !this.nuevoPedido.Id_Vendedor) {
      this.mostrarToast('Cliente y vendedor son obligatorios', 'danger');
      return;
    }

    if (!this.isEdit && this.detalles.length === 0) {
      this.mostrarToast('Agrega al menos un producto al pedido', 'danger');
      return;
    }

    const headers = { Authorization: `Bearer ${this.token}` };
    const body = {
      Id_Cliente: this.nuevoPedido.Id_Cliente,
      Id_Vendedor: this.nuevoPedido.Id_Vendedor,
      Subtotal_Pedido: this.nuevoPedido.Subtotal_Pedido,
      IVA: this.nuevoPedido.IVA,
      Total_Pedido: this.nuevoPedido.Total_Pedido,
      detalles: this.detalles.map(d => ({
        Id_Producto: d.Id_Producto,
        Cantidad: d.Cantidad,
        ValorVenta: d.ValorVenta,
        Descuento: d.Descuento
      }))
    };

    if (this.isEdit && this.nuevoPedido.Id_Pedido) {
      const updateBody = {
        Id_Cliente: this.nuevoPedido.Id_Cliente,
        Id_Vendedor: this.nuevoPedido.Id_Vendedor,
        Subtotal_Pedido: this.nuevoPedido.Subtotal_Pedido,
        IVA: this.nuevoPedido.IVA,
        Total_Pedido: this.nuevoPedido.Total_Pedido
      };

      this.http.put<any>(`${this.apiUrl}/pedido/${encodeURIComponent(this.nuevoPedido.Id_Pedido)}`, updateBody, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`Pedido "${response.data.Id_Pedido}" actualizado`, 'success');
            setTimeout(() => { this.modalController.dismiss({ action: 'updated', data: response.data }); }, 1000);
          }
        },
        error: () => this.mostrarToast('Error actualizando el pedido', 'danger')
      });
    } else {
      this.http.post<any>(`${this.apiUrl}/pedido`, body, { headers }).subscribe({
        next: (response) => {
          if (response.ok) {
            this.mostrarToast(`Pedido "${response.data.Id_Pedido}" creado`, 'success');
            setTimeout(() => { this.modalController.dismiss({ action: 'created', data: response.data }); }, 1000);
          }
        },
        error: (error) => {
          let mensaje = 'Error creando el pedido';
          if (error.error?.message) mensaje = error.error.message;
          this.mostrarToast(mensaje, 'danger');
        }
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

import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';
import { PedidoFormModalComponent } from './pedido-form-modal.component';

interface Pedido {
  Id_Pedido: string;
  Id_Cliente: string;
  Nombre_Cliente: string;
  Id_Vendedor: string;
  Nombre_Vendedor: string;
  Fecha_Pedido: string;
  Subtotal_Pedido: number;
  IVA: number;
  Total_Pedido: number;
}

@Component({
  standalone: true,
  selector: 'app-pedido',
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class PedidoPage implements OnInit {
  pedidos: Pedido[] = [];
  fabHidden = false;
  private lastScrollTop = 0;
  private scrollThreshold = 10;
  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/pedido';

  constructor(
    private router: Router,
    private http: HttpClient,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private auth: AuthService
  ) {
    addIcons({
      'add': add,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'checkmark-circle': checkmarkCircle,
      'alert-circle': alertCircle,
      'close-outline': closeOutline
    });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarPedidos();
  }

  async abrirFormulario() {
    const modal = await this.modalController.create({
      component: PedidoFormModalComponent,
      componentProps: {
        token: this.auth.token,
        isEdit: false
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (!res) return;
      if (res.action === 'created') {
        this.cargarPedidos(); // Recargar lista completa
      } else if (res.action === 'updated') {
        const idx = this.pedidos.findIndex(p => p.Id_Pedido === res.data.Id_Pedido);
        if (idx !== -1) this.pedidos[idx] = res.data;
      }
    });

    return await modal.present();
  }

  cargarPedidos() {
    const token = this.auth.token;
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.pedidos = response.data;
        }
      },
      error: (error) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.mostrarToast('Error cargando pedidos', 'danger');
        }
      }
    });
  }

  onScroll(ev: CustomEvent) {
    const st = (ev as any).detail.scrollTop;
    if (st > this.lastScrollTop + this.scrollThreshold) {
      if (!this.fabHidden) this.fabHidden = true;
    } else if (st < this.lastScrollTop - this.scrollThreshold) {
      if (this.fabHidden) this.fabHidden = false;
    }
    this.lastScrollTop = st;
  }

  async editarPedido(pedido: Pedido) {
    const modal = await this.modalController.create({
      component: PedidoFormModalComponent,
      componentProps: {
        token: this.auth.token,
        pedido,
        isEdit: true
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (res?.action === 'updated') {
        const idx = this.pedidos.findIndex(p => p.Id_Pedido === res.data.Id_Pedido);
        if (idx !== -1) this.pedidos[idx] = res.data;
      }
    });

    return await modal.present();
  }

  async confirmarEliminar(pedido: Pedido) {
    const alert = await this.alertController.create({
      header: 'Eliminar pedido',
      message: `¿Deseas eliminar el pedido "${pedido.Id_Pedido}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.eliminarPedido(pedido) }
      ]
    });
    await alert.present();
  }

  eliminarPedido(pedido: Pedido) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.delete<any>(`${this.apiUrl}/${encodeURIComponent(pedido.Id_Pedido)}`, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.pedidos = this.pedidos.filter(p => p.Id_Pedido !== pedido.Id_Pedido);
          this.mostrarToast(`Pedido "${pedido.Id_Pedido}" eliminado correctamente`, 'success');
        }
      },
      error: (error) => {
        let mensaje = 'No se pudo eliminar el pedido';
        if (error.error?.message) { mensaje = error.error.message; }
        else if (error.status === 404) { mensaje = 'Pedido no encontrado'; }
        this.mostrarToast(mensaje, 'danger');
      }
    });
  }

  async verDetalle(pedido: Pedido) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(pedido.Id_Pedido)}/detalle`, { headers }).subscribe({
      next: async (response) => {
        if (response.ok && response.data) {
          const detalles = response.data;
          let mensaje = `<strong>Pedido:</strong> ${pedido.Id_Pedido}<br>`;
          mensaje += `<strong>Cliente:</strong> ${pedido.Nombre_Cliente}<br>`;
          mensaje += `<strong>Vendedor:</strong> ${pedido.Nombre_Vendedor}<br><br>`;
          mensaje += `<strong>Productos:</strong><br>`;
          
          if (detalles.length === 0) {
            mensaje += `<em>Sin productos asociados</em>`;
          } else {
            detalles.forEach((d: any) => {
              const neto = d.ValorVenta - (d.Descuento || 0);
              mensaje += `- ${d.Nombre_Producto} (x${d.Cantidad}) - $${neto.toFixed(2)}<br>`;
            });
          }

          const alert = await this.alertController.create({
            header: 'Detalle del Pedido',
            message: mensaje,
            buttons: ['Cerrar']
          });
          await alert.present();
        }
      },
      error: () => {
        this.mostrarToast('Error obteniendo detalle del pedido', 'danger');
      }
    });
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 4000,
      position: 'bottom',
      color: color,
      icon: color === 'success' ? 'checkmark-circle' : color === 'warning' ? 'alert-circle' : 'close-outline',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ActivityService } from '../../services/activity.service';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, searchOutline, eyeOutline, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';

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
  selector: 'app-pedido-admin',
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class PedidoPage implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  searchTerm = '';
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
    private auth: AuthService,
    private activity: ActivityService
  ) {
    addIcons({
      'add': add,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'search-outline': searchOutline,
      'eye-outline': eyeOutline,
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

  ngOnDestroy() {
    this.modalController.getTop().then((top) => {
      if (top) {
        top.dismiss().catch(() => {});
      }
    });
  }

  async abrirFormulario() {
    const { PedidoFormModalAdminComponent } = await import('./pedido-form-modal.component');

    const modal = await this.modalController.create({
      component: PedidoFormModalAdminComponent,
      componentProps: {
        token: this.auth.token,
        isEdit: false
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (!res) return;
      if (res.action === 'created') {
        this.pedidos.unshift(res.data);
        this.activity.add({
          title: `Pedido creado: ${res.data.Id_Pedido}`,
          type: 'create',
          icon: add
        });
        this.filtrarPedidos();
      } else if (res.action === 'updated') {
        const idx = this.pedidos.findIndex(p => p.Id_Pedido === res.data.Id_Pedido);
        if (idx !== -1) {
          this.pedidos[idx] = res.data;
          this.activity.add({
            title: `Pedido actualizado: ${res.data.Id_Pedido}`,
            type: 'update',
            icon: createOutline
          });
          this.filtrarPedidos();
        }
      }
    });

    return await modal.present();
  }

  cargarPedidos() {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.pedidos = response.data;
          this.filtrarPedidos();
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

  filtrarPedidos() {
    if (!this.searchTerm.trim()) {
      this.pedidosFiltrados = this.pedidos;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.pedidosFiltrados = this.pedidos.filter(p =>
      p.Id_Pedido.toLowerCase().includes(term) ||
      p.Nombre_Cliente.toLowerCase().includes(term) ||
      p.Nombre_Vendedor.toLowerCase().includes(term)
    );
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
    const { PedidoFormModalAdminComponent } = await import('./pedido-form-modal.component');

    const modal = await this.modalController.create({
      component: PedidoFormModalAdminComponent,
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
        if (idx !== -1) {
          this.pedidos[idx] = res.data;
          this.activity.add({
            title: `Pedido actualizado: ${res.data.Id_Pedido}`,
            type: 'update',
            icon: createOutline
          });
          this.filtrarPedidos();
        }
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
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarPedido(pedido)
        }
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
          this.activity.add({
            title: `Pedido eliminado: ${pedido.Id_Pedido}`,
            type: 'delete',
            icon: trashOutline
          });
          this.filtrarPedidos();
          this.mostrarToast(`Pedido "${pedido.Id_Pedido}" eliminado`, 'success');
        }
      },
      error: (error) => {
        let mensaje = 'No se pudo eliminar el pedido';
        let color: 'success' | 'danger' | 'warning' = 'danger';
        if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.status === 404) {
          mensaje = 'Pedido no encontrado';
        }
        this.mostrarToast(mensaje, color);
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
            header: 'Detalle del pedido',
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
      color,
      icon: color === 'success' ? 'checkmark-circle' : color === 'warning' ? 'alert-circle' : 'close-outline',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }
}

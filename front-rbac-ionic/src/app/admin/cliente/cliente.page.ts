import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ActivityService } from '../../services/activity.service';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, checkmarkCircle, alertCircle, closeOutline, searchOutline } from 'ionicons/icons';

interface Cliente {
  Id_Cliente: string;
  Nombre_Cliente: string;
  Direccion_Cliente: string;
  Telefono_Cliente: string;
  Correo_Cliente: string;
}

@Component({
  standalone: true,
  selector: 'app-cliente',
  templateUrl: './cliente.page.html',
  styleUrls: ['./cliente.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class ClientePage implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  searchTerm = '';
  fabHidden = false;
  private lastScrollTop = 0;
  private scrollThreshold = 10;
  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/cliente';

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
      'checkmark-circle': checkmarkCircle,
      'alert-circle': alertCircle,
      'close-outline': closeOutline,
      'search-outline': searchOutline
    });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      console.warn('Usuario no autenticado. Redirigiendo a login...');
      this.router.navigate(['/login']);
      return;
    }
    this.cargarClientes();
  }

  ngOnDestroy() {
    this.modalController.getTop().then((top) => {
      if (top) {
        top.dismiss().catch(() => {});
      }
    });
  }

  async abrirFormulario() {
    const { ClienteFormModalComponent } = await import('./cliente-form-modal.component');

    const modal = await this.modalController.create({
      component: ClienteFormModalComponent,
      componentProps: {
        token: this.auth.token,
        isEdit: false
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (!res) return;
      if (res.action === 'created') {
        this.clientes.push(res.data);
        this.activity.add({
          title: `Cliente creado: ${res.data.Nombre_Cliente}`,
          type: 'create',
          icon: add
        });
        this.filtrarClientes();
      } else if (res.action === 'updated') {
        const idx = this.clientes.findIndex(c => c.Id_Cliente === res.data.Id_Cliente);
        if (idx !== -1) {
          this.clientes[idx] = res.data;
          this.activity.add({
            title: `Cliente actualizado: ${res.data.Nombre_Cliente}`,
            type: 'update',
            icon: createOutline
          });
          this.filtrarClientes();
        }
      }
    });

    return await modal.present();
  }

  cargarClientes() {
    const token = this.auth.token;
    const headers = { Authorization: `Bearer ${token}` };
      this.http.get<any>(this.apiUrl, { headers }).subscribe({
        next: (response) => {
          console.log('Clientes OK', { status: 200, ...response });
          if (response.ok) {
            this.clientes = response.data;
            this.filtrarClientes();
            console.log('✅ Clientes cargados:', this.clientes.length);
          }
        },
        error: (error) => {
          console.error('Clientes ERROR', { status: error.status, error });
          if (error.status === 401) {
            alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
            this.router.navigate(['/login']);
          } else {
            alert('Error cargando clientes');
          }
        }
      });
  }

  filtrarClientes() {
    if (!this.searchTerm.trim()) {
      this.clientesFiltrados = this.clientes;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.clientesFiltrados = this.clientes.filter(c =>
        c.Nombre_Cliente.toLowerCase().includes(term) ||
        c.Correo_Cliente.toLowerCase().includes(term) ||
        c.Telefono_Cliente.includes(term)
      );
    }
  }

  onScroll(ev: CustomEvent) {
    const st = (ev as any).detail.scrollTop;
    
    if (st > this.lastScrollTop + this.scrollThreshold) {
      if (!this.fabHidden) {
        this.fabHidden = true;
      }
    } else if (st < this.lastScrollTop - this.scrollThreshold) {
      if (this.fabHidden) {
        this.fabHidden = false;
      }
    }
    
    this.lastScrollTop = st;
  }

  async editarCliente(cliente: Cliente) {
    const { ClienteFormModalComponent } = await import('./cliente-form-modal.component');

    const modal = await this.modalController.create({
      component: ClienteFormModalComponent,
      componentProps: {
        token: this.auth.token,
        cliente,
        isEdit: true
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (res?.action === 'updated') {
        const idx = this.clientes.findIndex(c => c.Id_Cliente === res.data.Id_Cliente);
        if (idx !== -1) {
          this.clientes[idx] = res.data;
          this.activity.add({
            title: `Cliente actualizado: ${res.data.Nombre_Cliente}`,
            type: 'update',
            icon: createOutline
          });
          this.filtrarClientes();
        }
      }
    });

    return await modal.present();
  }

  async confirmarEliminar(cliente: Cliente) {
    const alert = await this.alertController.create({
      header: 'Eliminar cliente',
      message: `¿Deseas eliminar a "${cliente.Nombre_Cliente}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarCliente(cliente)
        }
      ]
    });

    await alert.present();
  }

  eliminarCliente(cliente: Cliente) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete<any>(`${this.apiUrl}/${encodeURIComponent(cliente.Id_Cliente)}`, { headers }).subscribe({
        next: (response) => {
          console.log('Eliminar Cliente OK', { status: 200, ...response });
          if (response.ok) {
            this.clientes = this.clientes.filter(c => c.Id_Cliente !== cliente.Id_Cliente);
            this.filtrarClientes();
            this.activity.add({
              title: `Cliente eliminado: ${cliente.Nombre_Cliente}`,
              type: 'delete',
              icon: trashOutline
            });
            console.log('✅ Cliente eliminado:', cliente.Id_Cliente);
            this.mostrarToast(`"${cliente.Nombre_Cliente}" eliminado correctamente`, 'success');
          }
        },
        error: (error) => {
          console.error('Eliminar Cliente ERROR', { status: error.status, error });
          let mensaje = 'No se pudo eliminar el cliente';
        let color: 'success' | 'danger' | 'warning' = 'danger';
        
        if (error.status === 409) {
          mensaje = `No se puede eliminar a "${cliente.Nombre_Cliente}" porque está asociado a pedidos activos.`;
          color = 'warning';
        } else if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.status === 404) {
          mensaje = 'Cliente no encontrado';
        }
        
        this.mostrarToast(mensaje, color);
      }
    });
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 4000,
      position: 'bottom',
      color: color,
      icon: color === 'success' ? 'checkmark-circle' : color === 'warning' ? 'alert-circle' : 'close-outline',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}

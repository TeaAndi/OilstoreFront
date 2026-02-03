import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ActivityService } from '../../services/activity.service';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, searchOutline, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';
import { VendedorFormModalComponent } from './vendedor-form-modal.component';

interface Vendedor {
  Id_Vendedor: string;
  Nombre_Vendedor: string;
  Direccion_Vendedor: string;
  Telefono_Vendedor: string;
  Correo_Vendedor: string;
}

@Component({
  standalone: true,
  selector: 'app-vendedor-admin',
  templateUrl: './vendedor.page.html',
  styleUrls: ['./vendedor.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class VendedorPage implements OnInit, OnDestroy {
  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  searchTerm = '';
  fabHidden = false;
  private lastScrollTop = 0;
  private scrollThreshold = 10;
  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/vendedor';

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
    this.cargarVendedores();
  }

  ngOnDestroy() {
    this.modalController.getTop().then((top) => {
      if (top) {
        top.dismiss().catch(() => {});
      }
    });
  }

  cargarVendedores() {
    const headers = { Authorization: `Bearer ${this.auth.token}`, 'ngrok-skip-browser-warning': 'true' };
    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.vendedores = response.data;
          this.filtrarVendedores();
        }
      },
      error: (error) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.mostrarToast('Error cargando vendedores', 'danger');
        }
      }
    });
  }

  filtrarVendedores() {
    if (!this.searchTerm.trim()) {
      this.vendedoresFiltrados = this.vendedores;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.vendedoresFiltrados = this.vendedores.filter(v =>
      v.Nombre_Vendedor.toLowerCase().includes(term) ||
      (v.Correo_Vendedor || '').toLowerCase().includes(term) ||
      (v.Telefono_Vendedor || '').includes(term)
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

  async abrirFormulario() {
    const modal = await this.modalController.create({
      component: VendedorFormModalComponent,
      componentProps: {
        token: this.auth.token,
        isEdit: false
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (!res) return;
      if (res.action === 'created') {
        this.vendedores.unshift(res.data);
        this.activity.add({
          title: `Vendedor creado: ${res.data.Nombre_Vendedor}`,
          type: 'create',
          icon: add
        });
        this.filtrarVendedores();
      } else if (res.action === 'updated') {
        const idx = this.vendedores.findIndex(v => v.Id_Vendedor === res.data.Id_Vendedor);
        if (idx !== -1) {
          this.vendedores[idx] = res.data;
          this.activity.add({
            title: `Vendedor actualizado: ${res.data.Nombre_Vendedor}`,
            type: 'update',
            icon: createOutline
          });
          this.filtrarVendedores();
        }
      }
    });

    return await modal.present();
  }

  async editarVendedor(vendedor: Vendedor) {
    const modal = await this.modalController.create({
      component: VendedorFormModalComponent,
      componentProps: {
        token: this.auth.token,
        vendedor,
        isEdit: true
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (res?.action === 'updated') {
        const idx = this.vendedores.findIndex(v => v.Id_Vendedor === res.data.Id_Vendedor);
        if (idx !== -1) {
          this.vendedores[idx] = res.data;
          this.activity.add({
            title: `Vendedor actualizado: ${res.data.Nombre_Vendedor}`,
            type: 'update',
            icon: createOutline
          });
          this.filtrarVendedores();
        }
      }
    });

    return await modal.present();
  }

  async confirmarEliminar(vendedor: Vendedor) {
    const alert = await this.alertController.create({
      header: 'Eliminar vendedor',
      message: `¿Deseas eliminar a "${vendedor.Nombre_Vendedor}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarVendedor(vendedor)
        }
      ]
    });

    await alert.present();
  }

  eliminarVendedor(vendedor: Vendedor) {
    const headers = { Authorization: `Bearer ${this.auth.token}`, 'ngrok-skip-browser-warning': 'true' };
    this.http.delete<any>(`${this.apiUrl}/${encodeURIComponent(vendedor.Id_Vendedor)}`, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.vendedores = this.vendedores.filter(v => v.Id_Vendedor !== vendedor.Id_Vendedor);
          this.activity.add({
            title: `Vendedor eliminado: ${vendedor.Nombre_Vendedor}`,
            type: 'delete',
            icon: trashOutline
          });
          this.filtrarVendedores();
          this.mostrarToast(`"${vendedor.Nombre_Vendedor}" eliminado`, 'success');
        }
      },
      error: (error) => {
        let mensaje = 'No se pudo eliminar el vendedor';
        let color: 'success' | 'danger' | 'warning' = 'danger';
        if (error.status === 409) {
          mensaje = `No se puede eliminar a "${vendedor.Nombre_Vendedor}" porque tiene pedidos asociados.`;
          color = 'warning';
        } else if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.status === 404) {
          mensaje = 'Vendedor no encontrado';
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
      color,
      icon: color === 'success' ? 'checkmark-circle' : color === 'warning' ? 'alert-circle' : 'close-outline',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }
}

import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';
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
  selector: 'app-vendedor',
  templateUrl: './vendedor.page.html',
  styleUrls: ['./vendedor.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class VendedorPage implements OnInit {
  vendedores: Vendedor[] = [];
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
    this.cargarVendedores();
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
        this.vendedores.push(res.data);
      } else if (res.action === 'updated') {
        const idx = this.vendedores.findIndex(c => c.Id_Vendedor === res.data.Id_Vendedor);
        if (idx !== -1) this.vendedores[idx] = res.data;
      }
    });

    return await modal.present();
  }

  cargarVendedores() {
    const token = this.auth.token;
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.vendedores = response.data;
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

  onScroll(ev: CustomEvent) {
    const st = (ev as any).detail.scrollTop;
    if (st > this.lastScrollTop + this.scrollThreshold) {
      if (!this.fabHidden) this.fabHidden = true;
    } else if (st < this.lastScrollTop - this.scrollThreshold) {
      if (this.fabHidden) this.fabHidden = false;
    }
    this.lastScrollTop = st;
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
        const idx = this.vendedores.findIndex(c => c.Id_Vendedor === res.data.Id_Vendedor);
        if (idx !== -1) this.vendedores[idx] = res.data;
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
        { text: 'Eliminar', role: 'destructive', handler: () => this.eliminarVendedor(vendedor) }
      ]
    });
    await alert.present();
  }

  eliminarVendedor(vendedor: Vendedor) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.delete<any>(`${this.apiUrl}/${encodeURIComponent(vendedor.Id_Vendedor)}`, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.vendedores = this.vendedores.filter(c => c.Id_Vendedor !== vendedor.Id_Vendedor);
          this.mostrarToast(`"${vendedor.Nombre_Vendedor}" eliminado correctamente`, 'success');
        }
      },
      error: (error) => {
        let mensaje = 'No se pudo eliminar el vendedor';
        let color: 'success' | 'danger' | 'warning' = 'danger';
        if (error.status === 409) { mensaje = `No se puede eliminar a "${vendedor.Nombre_Vendedor}" porque está asociado a pedidos activos.`; color = 'warning'; }
        else if (error.error?.message) { mensaje = error.error.message; }
        else if (error.status === 404) { mensaje = 'Vendedor no encontrado'; }
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
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }
}

import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { add, createOutline, trashOutline, checkmarkCircle, alertCircle, closeOutline } from 'ionicons/icons';

interface Producto {
  Id_Producto: string;
  Nombre_Producto: string;
  Descripcion_Producto: string;
  Stock_Producto: number;
  Valor_Producto: number;
  Unidad_Medida: string;
}

@Component({
  standalone: true,
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class ProductoPage implements OnInit {
  productos: Producto[] = [];
  fabHidden = false;
  private lastScrollTop = 0;
  private scrollThreshold = 10; // px para evitar parpadeos
  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/producto';

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
      console.warn('Usuario no autenticado. Redirigiendo a login...');
      this.router.navigate(['/login']);
      return;
    }
    this.cargarProductos();
  }

  async abrirFormulario() {
    const { ProductoFormModalComponent } = await import('./producto-form-modal.component');
    
    const modal = await this.modalController.create({
      component: ProductoFormModalComponent,
      componentProps: {
        token: this.auth.token,
        isEdit: false
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (!res) return;
      if (res.action === 'created') {
        this.productos.push(res.data);
      } else if (res.action === 'updated') {
        const idx = this.productos.findIndex(p => p.Id_Producto === res.data.Id_Producto);
        if (idx !== -1) this.productos[idx] = res.data;
      }
    });

    return await modal.present();
  }

  cargarProductos() {
    const token = this.auth.token;
    const headers = { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' };
    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.productos = response.data;
        }
      },
      error: (error) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.mostrarToast('Error cargando productos', 'danger');
        }
      }
    });
  }

  onScroll(ev: CustomEvent) {
    const st = (ev as any).detail.scrollTop;
    
    if (st > this.lastScrollTop + this.scrollThreshold) {
      // Scrolling down → esconder FAB
      if (!this.fabHidden) {
        this.fabHidden = true;
      }
    } else if (st < this.lastScrollTop - this.scrollThreshold) {
      // Scrolling up → mostrar FAB
      if (this.fabHidden) {
        this.fabHidden = false;
      }
    }
    
    this.lastScrollTop = st;
  }

  volver() {
    this.router.navigate(['/home-admin']);
  }

  async editarProducto(producto: Producto) {
    const { ProductoFormModalComponent } = await import('./producto-form-modal.component');
    const modal = await this.modalController.create({
      component: ProductoFormModalComponent,
      componentProps: {
        token: this.auth.token,
        producto,
        isEdit: true
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (res?.action === 'updated') {
        const idx = this.productos.findIndex(p => p.Id_Producto === res.data.Id_Producto);
        if (idx !== -1) this.productos[idx] = res.data;
      }
    });

    return await modal.present();
  }

  async confirmarEliminar(producto: Producto) {
    const alert = await this.alertController.create({
      header: 'Eliminar producto',
      message: `¿Deseas eliminar "${producto.Nombre_Producto}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarProducto(producto)
        }
      ]
    });

    await alert.present();
  }

  eliminarProducto(producto: Producto) {
    const headers = { Authorization: `Bearer ${this.auth.token}`, 'ngrok-skip-browser-warning': 'true' };
    this.http.delete<any>(`${this.apiUrl}/${encodeURIComponent(producto.Id_Producto)}`, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.productos = this.productos.filter(p => p.Id_Producto !== producto.Id_Producto);
          console.log('✅ Producto eliminado:', producto.Id_Producto);
          this.mostrarToast(`"${producto.Nombre_Producto}" eliminado correctamente`, 'success');
        }
      },
      error: (error) => {
        console.error('❌ Error eliminando producto:', error);
        let mensaje = 'No se pudo eliminar el producto';
        let color: 'success' | 'danger' | 'warning' = 'danger';
        
        if (error.status === 409) {
          mensaje = `No se puede eliminar "${producto.Nombre_Producto}" porque está asociado a pedidos activos.`;
          color = 'warning';
        } else if (error.error?.message) {
          mensaje = error.error.message;
        } else if (error.status === 404) {
          mensaje = 'Producto no encontrado';
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



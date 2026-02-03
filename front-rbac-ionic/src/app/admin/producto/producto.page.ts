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
export class ProductoPage implements OnInit, OnDestroy {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  searchTerm = '';
  fabHidden = false;
  private lastScrollTop = 0;
  private scrollThreshold = 10;
  private apiUrl = 'https://stereographic-martine-solitarily.ngrok-free.dev/api/producto';

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
    this.cargarProductos();
  }

  cargarProductos() {
    const token = this.auth.token;
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response.ok) {
          this.productos = response.data;
          this.filtrarProductos();
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

  filtrarProductos() {
    if (!this.searchTerm.trim()) {
      this.productosFiltrados = [...this.productos];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.productosFiltrados = this.productos.filter(p =>
        p.Nombre_Producto.toLowerCase().includes(term) ||
        p.Descripcion_Producto.toLowerCase().includes(term) ||
        p.Id_Producto.toLowerCase().includes(term)
      );
    }
  }

  onSearchChange() {
    this.filtrarProductos();
  }

  async abrirFormulario(producto?: Producto) {
    const { ProductoFormModalAdminComponent } = await import('./producto-form-modal.component');

    const modal = await this.modalController.create({
      component: ProductoFormModalAdminComponent,
      componentProps: {
        token: this.auth.token,
        isEdit: !!producto,
        producto: producto
      }
    });

    modal.onDidDismiss().then((result) => {
      const res = result.data;
      if (!res) return;
      if (res.action === 'created') {
        this.productos.push(res.data);
        this.filtrarProductos();
        this.mostrarToast('Producto creado exitosamente', 'success');
        this.activity.add({
          title: `Producto creado: ${res.data.Nombre_Producto}`,
          type: 'create',
          icon: add,
        });
      } else if (res.action === 'updated') {
        const idx = this.productos.findIndex(p => p.Id_Producto === res.data.Id_Producto);
        if (idx !== -1) this.productos[idx] = res.data;
        this.filtrarProductos();
        this.mostrarToast('Producto actualizado exitosamente', 'success');
        this.activity.add({
          title: `Producto actualizado: ${res.data.Nombre_Producto}`,
          type: 'update',
          icon: createOutline,
        });
      }
    });

    return await modal.present();
  }

  async eliminarProducto(producto: Producto) {
    const alert = await this.alertController.create({
      header: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar "${producto.Nombre_Producto}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminar(producto);
          }
        }
      ]
    });

    await alert.present();
  }

  confirmarEliminar(producto: Producto) {
    const token = this.auth.token;
    const headers = { Authorization: `Bearer ${token}` };
    this.http.delete(`${this.apiUrl}/${producto.Id_Producto}`, { headers }).subscribe({
      next: () => {
        this.productos = this.productos.filter(p => p.Id_Producto !== producto.Id_Producto);
        this.filtrarProductos();
        this.mostrarToast('Producto eliminado exitosamente', 'success');
        this.activity.add({
          title: `Producto eliminado: ${producto.Nombre_Producto}`,
          type: 'delete',
          icon: trashOutline,
        });
      },
      error: () => {
        this.mostrarToast('Error eliminando producto', 'danger');
      }
    });
  }

  async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    const diff = scrollTop - this.lastScrollTop;

    if (diff > this.scrollThreshold) {
      this.fabHidden = true;
    } else if (diff < -this.scrollThreshold) {
      this.fabHidden = false;
    }

    this.lastScrollTop = scrollTop;
  }

  ngOnDestroy() {
    // Cerrar modal si existe para evitar overlay errors
    this.modalController.getTop().then((top) => {
      if (top) {
        top.dismiss().catch(() => {});
      }
    });
  }
}

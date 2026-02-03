import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage {
  username = '';
  password = '';
  loading = false;
  welcome = false;
  welcomeMessage = '';

  constructor(private auth: AuthService, private router: Router, private alertController: AlertController) {
    // Registrar iconos para standalone
    addIcons({
      'person-outline': personOutline,
      'lock-closed-outline': lockClosedOutline,
    });
  }

  doLogin() {
    if (this.loading) return;
    this.loading = true;
    this.welcome = false;

    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        // Mostrar status 200 explícitamente
        console.log('Login OK', { status: 200, ...res });
        const target = this.auth.isSa() ? '/home-sa' : '/home-admin';
        this.welcomeMessage = `Bienvenido, ${this.auth.user?.username ?? this.username}`;

        // Pequeña pausa de carga y luego saludo antes de navegar
        setTimeout(() => {
          this.loading = false;
          this.welcome = true;

          setTimeout(() => {
            this.welcome = false;
            this.router.navigateByUrl(target);
          }, 1100);
        }, 800);
      },
      error: (err) => {
        // Mostrar el código de error HTTP explícitamente
        console.log('Login ERROR', { status: err.status, error: err });
        this.loading = false;
        this.welcome = false;
        if (err.status === 404 || err.status === 500 || err.status === 0) {
          this.mostrarErrorServidor();
        } else {
          alert(err?.error?.message ?? 'Login inválido');
        }
      },
    });
  }

  private async mostrarErrorServidor() {
    const alert = await this.alertController.create({
      header: 'Servidor no disponible',
      message: 'No se pudo conectar con el servidor. Intenta más tarde.',
      buttons: ['Aceptar']
    });
    await alert.present();
  }
}

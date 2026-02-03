import { Component, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, DbRole } from '../../services/usuarios.service';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  lockClosedOutline, 
  shieldCheckmarkOutline, 
  chevronUp, 
  chevronDown, 
  informationCircle 
} from 'ionicons/icons';


@Component({
  standalone: true,
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class UsuariosPage {
  username = '';
  password = '';
  dbRole: DbRole = 'db_datareader';

  loading = false;
  resultMsg = '';
  mostrarSelector = false;

  constructor(
    private usuariosService: UsuariosService, 
    private auth: AuthService
  ) {
    addIcons({
      'person-outline': personOutline,
      'lock-closed-outline': lockClosedOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'chevron-up': chevronUp,
      'chevron-down': chevronDown,
      'information-circle': informationCircle
    });
  }

  get isSa() {
    return this.auth.isSa();
  }

  crear() {
    this.resultMsg = '';

    if (!this.username.trim()) {
      this.resultMsg = 'Username es obligatorio';
      return;
    }

    if (!this.password.trim()) {
      this.resultMsg = 'Password es obligatorio';
      return;
    }

    this.loading = true;

    this.usuariosService.crearLogin(this.username.trim(), this.password, this.dbRole).subscribe({
      next: (res) => {
        this.loading = false;
        this.resultMsg = res?.message ?? 'Creado';

        // limpiar
        this.username = '';
        this.password = '';
        this.dbRole = 'db_datareader';
      },
      error: (err) => {
        this.loading = false;
        this.resultMsg = err?.error?.message ?? 'Error creando usuario';
      },
    });
  }

  toggleSelector() {
    this.mostrarSelector = !this.mostrarSelector;
  }

  seleccionarRol(rol: DbRole) {
    this.dbRole = rol;
    this.mostrarSelector = false;
  }

  getRolInfo() {
    const info: any = {
      'db_datareader': {
        nombre: 'db_datareader (Lectura)',
        descripcion: 'Permite leer datos de todas las tablas. Solo permisos SELECT.'
      },
      'db_datawriter': {
        nombre: 'db_datawriter (Escritura)',
        descripcion: 'Permite insertar, actualizar y eliminar datos. Permisos INSERT, UPDATE y DELETE.'
      },
      'db_owner': {
        nombre: 'db_owner (Admin BD)',
        descripcion: 'Control total sobre la base de datos. Puede crear tablas, vistas, procedimientos, etc.'
      }
    };
    return info[this.dbRole];
  }
}

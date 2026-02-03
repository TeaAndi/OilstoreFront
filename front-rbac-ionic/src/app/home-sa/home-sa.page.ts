import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-home-sa',
  templateUrl: 'home-sa.page.html',
  styleUrls: ['home-sa.page.scss'],
  imports: [IonicModule, CommonModule, RouterModule],
})
export class HomeSAPage {
  username = this.auth.user?.username ?? '';
  dbRole = this.auth.dbRole ?? 'public';

  constructor(private auth: AuthService, private router: Router) {}

  get isOwner() {
    return this.auth.isOwner();
  }

  get canRead() {
    return this.auth.canRead();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  get isSa() {
    return this.auth.isSa();
  }
}

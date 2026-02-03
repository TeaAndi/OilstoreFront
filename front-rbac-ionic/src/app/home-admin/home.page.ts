import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { cubeOutline, peopleOutline, businessOutline, documentOutline, addCircleOutline, createOutline, trashOutline, checkmarkCircleOutline, chevronDownOutline, refreshOutline, logOutOutline } from 'ionicons/icons';
import { Activity, ActivityService } from '../services/activity.service';

@Component({
  standalone: true,
  selector: 'app-home-admin',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonicModule, CommonModule, RouterModule],
})
export class HomeAdminPage implements OnInit, OnDestroy {
  username = this.auth.user?.username ?? '';
  dbRole = this.auth.dbRole ?? 'public';
  isActivityExpanded = true;

  cubeOutline = cubeOutline;
  peopleOutline = peopleOutline;
  businessOutline = businessOutline;
  documentOutline = documentOutline;
  chevronDownIcon = chevronDownOutline;

  recentActivity: Activity[] = [];
  private activitySub?: any;

  constructor(private auth: AuthService, public activityService: ActivityService, private alertCtrl: AlertController, private router: Router) {
    addIcons({
      'cube-outline': cubeOutline,
      'people-outline': peopleOutline,
      'business-outline': businessOutline,
      'document-outline': documentOutline,
      'add-circle-outline': addCircleOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'chevron-down-outline': chevronDownOutline,
      'refresh-outline': refreshOutline,
      'log-out-outline': logOutOutline,
    });
  }

  ngOnInit() {
    this.activitySub = this.activityService.activities$.subscribe((list) => {
      this.recentActivity = list;
    });
  }

  ngOnDestroy() {
    this.activitySub?.unsubscribe();
  }

  get isOwner() {
    return this.auth.isOwner();
  }

  get canRead() {
    return this.auth.canRead();
  }

  toggleActivity() {
    this.isActivityExpanded = !this.isActivityExpanded;
  }

  refreshActivity() {
    // Trigger a re-read from storage/service (no-op subscription will push latest)
    this.recentActivity = [...this.recentActivity];
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Desea cerrar sesión?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí',
          handler: () => {
            this.auth.logout();
            this.router.navigateByUrl('/login');
          },
        },
      ],
    });
    await alert.present();
  }
}

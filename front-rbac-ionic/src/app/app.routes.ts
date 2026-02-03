import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { ownerGuard } from './guards/owner.guard';
import { roleRouteGuard } from './guards/role-route.guard';

export const routes: Routes = [
  {
    path: 'home-admin',
    loadComponent: () => import('./home-admin/home.page').then((m) => m.HomeAdminPage),
    canActivate: [authGuard],
  },
  {
    path: 'home-sa',
    loadComponent: () => import('./home-sa/home-sa.page').then((m) => m.HomeSAPage),
    canActivate: [authGuard, ownerGuard], // Solo SA (db_owner)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  // Rutas genéricas que redirigen según rol
  {
    path: 'producto',
    canActivate: [roleRouteGuard('producto')],
    children: [],
  },
  {
    path: 'cliente',
    canActivate: [roleRouteGuard('cliente')],
    children: [],
  },
  {
    path: 'vendedor',
    canActivate: [roleRouteGuard('vendedor')],
    children: [],
  },
  {
    path: 'pedido',
    canActivate: [roleRouteGuard('pedido')],
    children: [],
  },
  // Rutas específicas para SA
  {
    path: 'sa/producto',
    loadComponent: () => import('./sa/producto/producto.page').then((m) => m.ProductoPage),
    canActivate: [authGuard],
  },
  {
    path: 'sa/cliente',
    loadComponent: () => import('./sa/cliente/cliente.page').then((m) => m.ClientePage),
    canActivate: [authGuard],
  },
  {
    path: 'sa/vendedor',
    loadComponent: () => import('./sa/vendedor/vendedor.page').then((m) => m.VendedorPage),
    canActivate: [authGuard],
  },
  {
    path: 'sa/pedido',
    loadComponent: () => import('./sa/pedido/pedido.page').then((m) => m.PedidoPage),
    canActivate: [authGuard],
  },
  {
    path: 'sa/usuarios',
    loadComponent: () => import('./sa/usuarios/usuarios.page').then((m) => m.UsuariosPage),
    canActivate: [authGuard, ownerGuard], // Solo db_owner (SA)
  },
  // Rutas específicas para Admin
  {
    path: 'admin/producto',
    loadComponent: () => import('./admin/producto/producto.page').then((m) => m.ProductoPage),
    canActivate: [authGuard],
  },
  {
    path: 'admin/cliente',
    loadComponent: () => import('./admin/cliente/cliente.page').then((m) => m.ClientePage),
    canActivate: [authGuard],
  },
  {
    path: 'admin/pedido',
    loadComponent: () => import('./admin/pedido/pedido.page').then((m) => m.PedidoPage),
    canActivate: [authGuard],
  },
  {
    path: 'admin/vendedor',
    loadComponent: () => import('./admin/vendedor/vendedor.page').then((m) => m.VendedorPage),
    canActivate: [authGuard],
  },
];

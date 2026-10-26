import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';
import { Cart } from './pages/cart/cart';
import { Order } from './pages/order/order';
import { ProductForm } from './pages/product-form/product-form';
import { StockManager } from './pages/stock-manager/stock-manager';
import { authGuard, adminGuard } from './guards/auth-guard';
import { Profile } from './pages/profile/profile';
import { ProductDetail } from './pages/product-detail/product-detail';

export const routes: Routes = [
{ path: '', component: Home },
  { path: 'signin', component: Signin },
  { path: 'signup', component: Signup },
  { path: 'cart', component: Cart },
  { path: 'order', component: Order, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'productos/nuevo', component: ProductForm, canActivate: [adminGuard] },
  { path: 'productos/stock', component: StockManager, canActivate: [adminGuard] },
  { path: 'producto/:id', component: ProductDetail },
  { path: '**', redirectTo: '' },

  // acá van signup, signin, cart, etc.
];

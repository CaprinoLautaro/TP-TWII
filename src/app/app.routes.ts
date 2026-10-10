import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';
import { Cart } from './pages/cart/cart';
import { Order } from './pages/order/order';
import { ProductForm } from './pages/product-form/product-form';

export const routes: Routes = [
  { path: '', component: Home },
    { path: 'signin', component: Signin},
  { path: 'signup', component: Signup },
  { path: 'cart', component: Cart },
  { path: 'order', component: Order },
  // TODO: restringir a rol admin cuando exista el rol simulado
  { path: 'productos/nuevo', component: ProductForm },
  // acá van signup, signin, cart, etc.
];

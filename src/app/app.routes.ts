import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';
import { Cart } from './pages/cart/cart';
import { Order } from './pages/order/order';

export const routes: Routes = [
  { path: '', component: Home },
    { path: 'signin', component: Signin},
  { path: 'signup', component: Signup },
  { path: 'cart', component: Cart },
  { path: 'order', component: Order },
  // acá van signup, signin, cart, etc.
];

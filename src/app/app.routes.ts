import { Routes } from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {ArticleDetailComponent} from './pages/article-detail/article-detail.component';
import {CategoriesComponent} from './pages/categories/categories.component';
import {AboutComponent} from './pages/about/about.component';
import {LoginComponent} from './pages/login/login.component';
import {AdminComponent} from './pages/admin/admin.component';
import {authGuard} from './guards/auth.guard';
import {adminGuard} from './guards/admin.guard';
import {SearchComponent} from './pages/search/search.component';
import {ArticleFormComponent} from './pages/article-form/article-form.component';
import {moderatorGuard} from './guards/moderator.guard';
import {ProfileComponent} from './pages/profile/profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'article/:id', component: ArticleDetailComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'search', component: SearchComponent, canActivate: [authGuard] },
  { path: 'admin/article/new', component: ArticleFormComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/article/edit/:id', component: ArticleFormComponent, canActivate: [authGuard, adminGuard] },
  { path: 'moderator', component: AdminComponent, canActivate: [authGuard, moderatorGuard] },
  { path: 'moderator/article/new', component: ArticleFormComponent, canActivate: [authGuard, moderatorGuard] },
  { path: 'moderator/article/edit/:id', component: ArticleFormComponent, canActivate: [authGuard, moderatorGuard] },
  { path: '**', redirectTo: 'login' }
];

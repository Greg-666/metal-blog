import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {BehaviorSubject, Observable, map, catchError} from 'rxjs';
import {environment} from '../../environments/environment';

export interface User {
  id?: number;
  email: string;
  password: string;
  username: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'approved' | 'pending' | 'rejected';
  country? : string;
  avatar_color?: string;
  avatar_emoji?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        this.currentUserSubject.next(JSON.parse(savedUser));
      }
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      map(user => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(err => {
        throw new Error(err.error?.message || 'Erreur de connexion');
      })
    );
  }

  register(email: string, password: string, username: string, country: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, { email, password, username, country }).pipe(
      catchError(err => {
        throw new Error(err.error?.message || 'Erreur lors de l\'inscription');
      })
    );
  }

 /* register(email: string, password: string, username: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, { email, password, username }).pipe(
      catchError(err => {
        throw new Error(err.error?.message || 'Erreur lors de l\'inscription');
      })
    );
  }*/

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  isModerator(): boolean {
    const role = this.currentUserSubject.value?.role;
    return role === 'moderator' || role === 'admin';
  }
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: number, data: { username: string, country: string, password?: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data);
  }
  updateCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  requestDeleteAccount(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/request-delete`, {});
  }

  confirmDeleteAccount(id: number, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/confirm-delete`, { code });
  }
}

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isLoginMode = true;
  isForgotMode = false;
  email = '';
  password = '';
  username = '';
  forgotEmail = '';
  errorMessage = '';
  successMessage = '';
  private apiUrl = environment.apiUrl;
  country = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.isForgotMode = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  toggleForgotMode(): void {
    this.isForgotMode = !this.isForgotMode;
    this.isLoginMode = !this.isForgotMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isLoginMode) {
      this.authService.login(this.email, this.password).subscribe({
        next: (user) => {
          if (user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (user.role === 'moderator') {
            this.router.navigate(['/moderator']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
    } else {
      if (!this.username || !this.email || !this.password) {
        this.errorMessage = 'Tous les champs sont obligatoires';
        return;
      }
      this.authService.register(this.email, this.password, this.username,this.country).subscribe({
        next: () => {
          this.successMessage = 'Demande envoyée ! En attente de validation par l\'admin.';
          this.email = '';
          this.password = '';
          this.username = '';
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
    }
  }

  submitForgotPassword(): void {
    if (!this.forgotEmail.trim()) {
      this.errorMessage = 'Veuillez entrer votre email';
      return;
    }
    this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email: this.forgotEmail }).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.forgotEmail = '';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de l\'envoi';
      }
    });
  }
  showPassword = false;
}

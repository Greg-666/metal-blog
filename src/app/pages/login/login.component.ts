import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isLoginMode = true;
  email = '';
  password = '';
  username = '';
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
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
      this.authService.register(this.email, this.password, this.username).subscribe({
        next: () => {
          this.successMessage = 'Demande envoyée ! En attente de validation par l\'admin.';
          this.email = '';
          this.password = '';
          this.username = '';
        },
        error: () => {
          this.errorMessage = 'Une erreur est survenue, réessayez.';
        }
      });
    }
  }
}

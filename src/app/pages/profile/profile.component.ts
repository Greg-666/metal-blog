import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  username = '';
  country = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  successMessage = '';
  errorMessage = '';

  countries = [
    { flag: '🇧🇪', name: 'Belgique' },
    { flag: '🇫🇷', name: 'France' },
    { flag: '🇨🇭', name: 'Suisse' },
    { flag: '🇱🇺', name: 'Luxembourg' },
    { flag: '🇺🇸', name: 'États-Unis' },
    { flag: '🇬🇧', name: 'Royaume-Uni' },
    { flag: '🇩🇪', name: 'Allemagne' },
    { flag: '🇪🇸', name: 'Espagne' },
    { flag: '🇮🇹', name: 'Italie' },
    { flag: '🇳🇱', name: 'Pays-Bas' },
    { flag: '🇸🇪', name: 'Suède' },
    { flag: '🇳🇴', name: 'Norvège' },
    { flag: '🇫🇮', name: 'Finlande' },
    { flag: '🇩🇰', name: 'Danemark' },
    { flag: '🇧🇷', name: 'Brésil' },
    { flag: '🇯🇵', name: 'Japon' },
    { flag: '🇦🇺', name: 'Australie' },
    { flag: '🇨🇦', name: 'Canada' },
    { flag: '🌍', name: 'Autre' }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.username = this.user.username;
      this.country = this.user.country || '';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.username.trim()) {
      this.errorMessage = 'Le pseudo ne peut pas être vide.';
      return;
    }

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    const data: any = { username: this.username, country: this.country };
    if (this.newPassword) data.password = this.newPassword;

    this.authService.updateUser(this.user!.id!, data).subscribe({
      next: (updatedUser) => {
        this.authService.updateCurrentUser(updatedUser);
        this.successMessage = 'Profil mis à jour avec succès !';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors de la mise à jour.';
      }
    });
  }
}

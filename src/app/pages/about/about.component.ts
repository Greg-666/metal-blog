import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  contactName = '';
  contactEmail = '';
  contactMessage = '';
  successMessage = '';
  errorMessage = '';
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendContact(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.contactName.trim() || !this.contactEmail.trim() || !this.contactMessage.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    this.http.post(`${this.apiUrl}/contact`, {
      name: this.contactName,
      email: this.contactEmail,
      message: this.contactMessage
    }).subscribe({
      next: () => {
        this.successMessage = 'Message envoyé avec succès ! Nous vous répondrons bientôt.';
        this.contactName = '';
        this.contactEmail = '';
        this.contactMessage = '';
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'envoi. Réessayez plus tard.';
      }
    });
  }
}

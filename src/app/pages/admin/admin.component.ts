import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { DatePipe } from '@angular/common';
import {RouterLink} from '@angular/router';

interface Article {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  activeTab = 'users';
  users: User[] = [];
  pendingUsers: User[] = [];
  articles: Article[] = [];

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadArticles();
  }

  loadUsers(): void {
    this.http.get<User[]>('http://localhost:3000/users').subscribe(users => {
      this.users = users.filter(u => u.status === 'approved');
      this.pendingUsers = users.filter(u => u.status === 'pending');
    });
  }

  loadArticles(): void {
    this.http.get<Article[]>('http://localhost:3000/articles').subscribe(articles => {
      this.articles = articles;
    });
  }

  approveUser(user: User): void {
    this.http.patch(`http://localhost:3000/users/${user.id}`, { status: 'approved' }).subscribe(() => {
      this.loadUsers();
    });
  }

  rejectUser(user: User): void {
    this.http.patch(`http://localhost:3000/users/${user.id}`, { status: 'rejected' }).subscribe(() => {
      this.loadUsers();
    });
  }

  promoteToModerator(user: User): void {
    this.http.patch(`http://localhost:3000/users/${user.id}`, { role: 'moderator' }).subscribe(() => {
      this.loadUsers();
    });
  }

  demoteToMember(user: User): void {
    this.http.patch(`http://localhost:3000/users/${user.id}`, { role: 'member' }).subscribe(() => {
      this.loadUsers();
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Supprimer l'utilisateur ${user.username} ?`)) {
      this.http.delete(`http://localhost:3000/users/${user.id}`).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  deleteArticle(article: Article): void {
    if (confirm(`Supprimer l'article "${article.title}" ?`)) {
      this.http.delete(`http://localhost:3000/articles/${article.id}`).subscribe(() => {
        this.loadArticles();
      });
    }
  }
}

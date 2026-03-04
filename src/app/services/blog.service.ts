import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  content: string;
  image: string;
  tags: string[];
  photos?: string[];
  video_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/articles`);
  }

  getArticleById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/articles/${id}`);
  }

  getArticlesByCategory(category: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/articles?category=${category}`);
  }

  searchArticles(query: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/articles`);
  }

  getCategories(): Observable<string[]> {
    return new Observable(observer => {
      this.getArticles().subscribe(articles => {
        const categories = [...new Set(articles.map(a => a.category))];
        observer.next(categories);
        observer.complete();
      });
    });
  }

  getCommentsByArticleId(articleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/comments?articleId=${articleId}`);
  }

  addComment(comment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/comments`, comment);
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${commentId}`);
  }
}

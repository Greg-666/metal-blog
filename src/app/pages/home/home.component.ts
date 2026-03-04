import { Component, OnInit } from '@angular/core';
import { ArticleCardComponent } from '../article-card/article-card.component';
import { BlogService, Article } from '../../services/blog.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ArticleCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  articles: Article[] = [];

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.blogService.getArticles().subscribe(articles => {
      this.articles = articles;
    });
  }
}

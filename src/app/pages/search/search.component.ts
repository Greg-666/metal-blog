import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService, Article } from '../../services/blog.service';
import { ArticleCardComponent } from '../article-card/article-card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ArticleCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {
  query = '';
  results: Article[] = [];

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.blogService.getArticles().subscribe(articles => {
          const q = this.query.toLowerCase();
          this.results = articles.filter(a =>
            a.title.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q) ||
            a.tags.some(t => t.toLowerCase().includes(q)) ||
            a.author.toLowerCase().includes(q)
          );
        });
      }
    });
  }
}

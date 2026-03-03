import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
        this.results = this.blogService.searchArticles(this.query);
      }
    });
  }
}

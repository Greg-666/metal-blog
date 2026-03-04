import { Component, OnInit } from '@angular/core';
import { BlogService, Article } from '../../services/blog.service';
import { ArticleCardComponent } from '../article-card/article-card.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ArticleCardComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  categories: string[] = [];
  selectedCategory: string = '';
  filteredArticles: Article[] = [];

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.blogService.getCategories().subscribe(categories => {
      this.categories = categories;
      if (categories.length > 0) {
        this.selectedCategory = categories[0];
        this.selectCategory(categories[0]);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.blogService.getArticlesByCategory(category).subscribe(articles => {
      this.filteredArticles = articles.filter(a => a.category === category);
    });
  }
}

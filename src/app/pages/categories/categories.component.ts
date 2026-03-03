import {Component, OnInit} from '@angular/core';
import {Article, BlogService} from '../../services/blog.service';
import {ArticleCardComponent} from '../article-card/article-card.component';

@Component({
  selector: 'app-categories',
  imports: [
    ArticleCardComponent
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit{
  categories: string[] = [];
  selectedCategory: string = '';
  filteredArticles: Article[] = [];

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {

    this.categories = this.blogService.getCategories();
    this.selectedCategory = this.categories[0];
    this.filteredArticles = this.blogService.getArticlesByCategory(this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.filteredArticles = this.blogService.getArticlesByCategory(category);
  }


}

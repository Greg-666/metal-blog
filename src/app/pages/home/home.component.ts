import {Component, OnInit} from '@angular/core';
import {Article, BlogService} from '../../services/blog.service';
import {ArticleCardComponent} from '../article-card/article-card.component';

@Component({
  selector: 'app-home',
  imports: [
    ArticleCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  articles : Article[] = [];
  constructor(private blogservice: BlogService) {
  }

  ngOnInit(): void {
    this.articles = this.blogservice.getArticles();
  }

}

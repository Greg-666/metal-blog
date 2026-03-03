import {Component, Input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Article} from '../../services/blog.service';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-article-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.css'
})
export class ArticleCardComponent {
  @Input() article! : Article;
}

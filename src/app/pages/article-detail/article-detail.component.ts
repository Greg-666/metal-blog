import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { BlogService, Article } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import {DatePipe, isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css'
})
export class ArticleDetailComponent implements OnInit {
  article: Article | undefined;
  comments: any[] = [];
  newComment = '';
  currentUrl = '';

  constructor(

    private route: ActivatedRoute,
    private blogService: BlogService,
    public authService: AuthService,
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUrl = encodeURIComponent(window.location.href);
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.blogService.getArticleById(id).subscribe(article => {
      this.article = article;
      this.title.setTitle(article.title + ' | MetalBlog');
      this.meta.updateTag({ name: 'description', content: article.summary });
      this.meta.updateTag({ property: 'og:title', content: article.title });
      this.meta.updateTag({ property: 'og:description', content: article.summary });
      this.meta.updateTag({ property: 'og:image', content: article.image });
      this.meta.updateTag({ property: 'og:type', content: 'article' });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.meta.updateTag({ name: 'twitter:title', content: article.title });
      this.meta.updateTag({ name: 'twitter:description', content: article.summary });
      this.meta.updateTag({ name: 'twitter:image', content: article.image });
    });
    this.loadComments(id);
  }

  loadComments(articleId: number): void {
    this.blogService.getCommentsByArticleId(articleId).subscribe(comments => {
      this.comments = comments;
    });
  }

  submitComment(): void {
    if (!this.newComment.trim()) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const comment = {
      articleId: this.article?.id,
      content: this.newComment,
      author: user.username,
      date: new Date().toISOString()
    };

    this.blogService.addComment(comment).subscribe(() => {
      this.newComment = '';
      this.loadComments(this.article!.id);
    });
  }

  deleteComment(commentId: number): void {
    if (confirm('Supprimer ce commentaire ?')) {
      this.blogService.deleteComment(commentId).subscribe(() => {
        this.loadComments(this.article!.id);
      });
    }
  }
}

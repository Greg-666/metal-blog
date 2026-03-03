import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { BlogService, Article } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.css'
})
export class ArticleDetailComponent implements OnInit {
  article: Article | undefined;
  comments: any[] = [];
  newComment = '';

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    public authService: AuthService,
    private meta: Meta,
    private title: Title
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.article = this.blogService.getArticleById(id);
    this.loadComments(id);

    if (this.article) {
      this.title.setTitle(this.article.title + ' | MetalBlog');
      this.meta.updateTag({ name: 'description', content: this.article.summary });
      this.meta.updateTag({ property: 'og:title', content: this.article.title });
      this.meta.updateTag({ property: 'og:description', content: this.article.summary });
      this.meta.updateTag({ property: 'og:image', content: this.article.image });
      this.meta.updateTag({ property: 'og:type', content: 'article' });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.meta.updateTag({ name: 'twitter:title', content: this.article.title });
      this.meta.updateTag({ name: 'twitter:description', content: this.article.summary });
      this.meta.updateTag({ name: 'twitter:image', content: this.article.image });
    }
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

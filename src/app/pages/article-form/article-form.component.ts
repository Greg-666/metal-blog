import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { environment } from '../../../environments/environment';

interface Article {
  id?: number;
  title: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  content: string;
  image: string;
  tags: string[];
  photos: string[];
  video_url: string;
}

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [FormsModule, SafeUrlPipe],
  templateUrl: './article-form.component.html',
  styleUrl: './article-form.component.css'
})
export class ArticleFormComponent implements OnInit {
  isEditMode = false;
  articleId: number | null = null;
  tagInput = '';
  photoInput = '';
  selectedCategory = '';
  customCategory = '';
  private apiUrl = environment.apiUrl;

  article: Article = {
    title: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    author: '',
    summary: '',
    content: '',
    image: '',
    tags: [],
    photos: [],
    video_url: ''
  };

  categories = [
    'Rock n Roll',
    'Hard-Rock',
    'Heavy Metal',
    'Thrash Metal',
    'Black Metal',
    'Death Metal',
    'Doom Metal',
    'Power Metal',
    'Progressive Metal',
    'Folk Metal'
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.articleId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.articleId) {
      this.isEditMode = true;
      this.http.get<Article>(`${this.apiUrl}/articles/${this.articleId}`).subscribe(article => {
        this.article = article;
        this.tagInput = article.tags.join(', ');
        this.photoInput = article.photos ? article.photos.join('\n') : '';
        if (this.categories.includes(article.category)) {
          this.selectedCategory = article.category;
        } else {
          this.selectedCategory = 'autre';
          this.customCategory = article.category;
        }
      });
    }
  }

  onCategoryChange(): void {
    if (this.selectedCategory !== 'autre') {
      this.article.category = this.selectedCategory;
    }
  }

  applyCustomCategory(): void {
    if (this.customCategory.trim()) {
      this.article.category = this.customCategory.trim();
    }
  }

  addTag(): void {
    const tags = this.tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.article.tags = tags;
  }

  addPhotos(): void {
    const photos = this.photoInput.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    this.article.photos = photos;
  }

  getYoutubeEmbedUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  onSubmit(): void {
    this.addTag();
    this.addPhotos();

    if (this.selectedCategory === 'autre' && this.customCategory.trim()) {
      this.article.category = this.customCategory.trim();
    } else {
      this.article.category = this.selectedCategory;
    }

    if (this.article.video_url) {
      this.article.video_url = this.getYoutubeEmbedUrl(this.article.video_url);
    }

    if (!this.article.title || !this.article.category || !this.article.content) {
      alert('Titre, catégorie et contenu sont obligatoires !');
      return;
    }

    if (this.isEditMode) {
      this.http.put(`${this.apiUrl}/articles/${this.articleId}`, this.article).subscribe(() => {
        this.router.navigate(['/admin']);
      });
    } else {
      this.article.date = new Date().toISOString().split('T')[0];
      this.http.post(`${this.apiUrl}/articles`, this.article).subscribe(() => {
        this.router.navigate(['/admin']);
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin']);
  }
}

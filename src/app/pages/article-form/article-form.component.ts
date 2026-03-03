import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
}

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './article-form.component.html',
  styleUrl: './article-form.component.css'
})
export class ArticleFormComponent implements OnInit {
  isEditMode = false;
  articleId: number | null = null;
  tagInput = '';

  article: Article = {
    title: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    author: '',
    summary: '',
    content: '',
    image: '',
    tags: []
  };
  selectedCategory = '';
  customCategory = '';
  categories = [
    'Heavy Metal',
    'Thrash Metal',
    'Black Metal',
    'Death Metal',
    'Doom Metal',
    'Power Metal',
    'Progressive Metal',
    'Folk Metal',

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
      this.http.get<Article>(`http://localhost:3000/articles/${this.articleId}`).subscribe(article => {
        this.article = article;
        this.tagInput = article.tags.join(', ');
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

  addTag(): void {
    const tags = this.tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.article.tags = tags;
  }

  onSubmit(): void {
    this.addTag();

    if (this.selectedCategory === 'autre' && this.customCategory.trim()) {
      this.article.category = this.customCategory.trim();
    } else {
      this.article.category = this.selectedCategory;
    }

    if (!this.article.title || !this.article.category || !this.article.content) {
      alert('Titre, catégorie et contenu sont obligatoires !');
      return;
    }

    if (this.isEditMode) {
      this.http.put(`http://localhost:3000/articles/${this.articleId}`, this.article).subscribe(() => {
        this.router.navigate(['/admin']);
      });
    } else {
      this.article.date = new Date().toISOString().split('T')[0];
      this.http.post('http://localhost:3000/articles', this.article).subscribe(() => {
        this.router.navigate(['/admin']);
      });
    }
  }


  cancel(): void {
    this.router.navigate(['/admin']);
  }
  applyCustomCategory(): void {
    if (this.customCategory.trim()) {
      this.categories.push(this.customCategory.trim());
      this.article.category = this.customCategory.trim();
    }
  }
}

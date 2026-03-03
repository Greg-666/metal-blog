import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

export interface Article {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  content: string;
  image: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  constructor(private http: HttpClient) {}

  private articles: Article[] = [
    {
      id: 1,
      title: 'Black Sabbath : les pères fondateurs du Metal',
      category: 'Heavy Metal',
      date: '2024-01-15',
      author: 'IronPen',
      summary: 'Retour sur le groupe qui a tout inventé et dont l\'influence est encore immense aujourd\'hui.',
      content: 'Black Sabbath est souvent considéré comme le groupe fondateur du heavy metal. Formé à Birmingham en 1968, le groupe composé d\'Ozzy Osbourne, Tony Iommi, Geezer Butler et Bill Ward a révolutionné la musique rock avec des riffs lourds et une atmosphère sombre et oppressante...',
      image:'https://ichef.bbci.co.uk/ace/standard/921/cpsprodpb/bb46/live/455d1890-67a1-11f0-8979-21e9e3d3b0da.jpg',
      tags: ['Heavy Metal', 'Classic', 'Black Sabbath']
    },
    {
      id: 2,
      title: 'Metallica - Master of Puppets : chef d\'oeuvre intemporel',
      category: 'Thrash Metal',
      date: '2024-01-22',
      author: 'ThrashQueen',
      summary: 'Analyse complète de l\'album qui a redéfini le Thrash Metal en 1986.',
      content: 'Sorti en 1986, Master of Puppets est souvent cité comme l\'un des meilleurs albums de metal de tous les temps. Metallica y démontre une maîtrise technique et une cohérence artistique rarement égalées dans le genre...',
      image: 'https://e7.pngegg.com/pngimages/826/930/png-clipart-master-of-puppets-metallica-album-thrash-metal-phonograph-record-metallica-album-text-thumbnail.png',
      tags: ['Thrash Metal', 'Metallica', 'Review']
    },
    {
      id: 3,
      title: 'Le Black Metal norvégien : histoire d\'une scène légendaire',
      category: 'Black Metal',
      date: '2024-02-05',
      author: 'FrostWriter',
      summary: 'Plongée dans les origines et l\'évolution du Black Metal scandinave des années 90.',
      content: 'La scène black metal norvégienne des années 90 est l\'une des plus fascinantes et controversées de l\'histoire du metal. Des groupes comme Mayhem, Burzum, Darkthrone et Emperor ont forgé un son et une esthétique qui influencent encore aujourd\'hui des milliers de groupes...',
      image: 'https://m.media-amazon.com/images/I/61rw3N0L3-L._AC_UF1000,1000_QL80_.jpg',
      tags: ['Black Metal', 'Norvège', 'Histoire']
    },
    {
      id: 4,
      title: 'Death Metal : guide pour les nouveaux initiés',
      category: 'Death Metal',
      date: '2024-02-18',
      author: 'IronPen',
      summary: 'Vous voulez découvrir le Death Metal ? Voici par où commencer.',
      content: 'Le Death Metal peut sembler intimidant pour les non-initiés avec ses guitares accordées très bas, ses blast beats et ses vocaux gutturaux. Pourtant c\'est un genre riche en nuances et en talent. Des groupes comme Death, Morbid Angel ou Obituary sont d\'excellents points d\'entrée...',
      image: 'https://miro.medium.com/1*F_XS0wVKl3ikuolYVyCahw@2x.jpeg',
      tags: ['Death Metal', 'Guide', 'Débutant']
    },
    {
      id: 5,
      title: 'Doom Metal : quand la lenteur devient une arme',
      category: 'Doom Metal',
      date: '2024-03-01',
      author: 'SlowBurn',
      summary: 'Exploration du Doom Metal, ce genre hypnotique qui fait de la lourdeur son art.',
      content: 'Le Doom Metal est peut-être le sous-genre le plus contemplatif du metal. Des groupes comme Candlemass, My Dying Bride ou Electric Wizard ont exploré les territoires de la lenteur et de la pesanteur pour créer une musique d\'une intensité émotionnelle rare...',
      image: 'https://i.ytimg.com/vi/FqPAwr1Vb-4/maxresdefault.jpg',
      tags: ['Doom Metal', 'Electric Wizard', 'Candlemass']
    }
  ];

  getArticles(): Article[] {
    return this.articles;
  }

  getArticleById(id: number): Article | undefined {
    return this.articles.find(a => a.id === id);
  }

  getArticlesByCategory(category: string): Article[] {
    return this.articles.filter(a => a.category === category);
  }

  getCategories(): string[] {
    return [...new Set(this.articles.map(a => a.category))];
  }
  getCommentsByArticleId(articleId: number): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/comments?articleId=${articleId}`);
  }

  addComment(comment: any): Observable<any> {
    return this.http.post('http://localhost:3000/comments', comment);
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/comments/${commentId}`);
  }
  searchArticles(query: string): Article[] {
    const q = query.toLowerCase().trim();
    return this.articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q)) ||
      a.author.toLowerCase().includes(q)
    );
  }
}

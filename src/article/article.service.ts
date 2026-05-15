import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Article } from './article.entity';
import { ArticleWriteDto } from './dto/article-write.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';

function formatPublished(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toAdminArticle(row: Article): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: formatPublished(row.publishedAt),
    category: row.category,
    tags: row.tags,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    author: row.author,
    coverImage: row.coverImage,
    contentMarkdown: row.contentMarkdown,
  };
  if (row.contentHtml != null && row.contentHtml !== '') {
    base.contentHtml = row.contentHtml;
  }
  return base;
}

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  async findPage(query: QueryArticlesDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));
    const qb = this.articleRepo.createQueryBuilder('a');
    const q = query.q?.trim();
    if (q) {
      qb.andWhere(
        new Brackets((wb) => {
          wb.where('a.title LIKE :like', { like: `%${q}%` })
            .orWhere('a.excerpt LIKE :like', { like: `%${q}%` })
            .orWhere('a.contentMarkdown LIKE :like', { like: `%${q}%` })
            .orWhere('CAST(a.tags AS CHAR) LIKE :like', { like: `%${q}%` });
        }),
      );
    }
    qb.orderBy('a.publishedAt', 'DESC').addOrderBy('a.id', 'DESC');
    const [rows, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return {
      items: rows.map(toAdminArticle),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: ArticleWriteDto) {
    const entity = this.articleRepo.create({
      id: randomUUID(),
      title: dto.title,
      excerpt: dto.excerpt,
      publishedAt: new Date(`${dto.publishedAt}T00:00:00.000Z`),
      category: dto.category,
      tags: dto.tags,
      views: dto.views,
      likes: dto.likes,
      comments: dto.comments,
      author: dto.author,
      coverImage: dto.coverImage,
      contentMarkdown: dto.contentMarkdown,
      contentHtml: dto.contentHtml ?? null,
    });
    const saved = await this.articleRepo.save(entity);
    return toAdminArticle(saved);
  }

  async update(id: string, dto: ArticleWriteDto) {
    const row = await this.articleRepo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('文章不存在');
    }
    row.title = dto.title;
    row.excerpt = dto.excerpt;
    row.publishedAt = new Date(`${dto.publishedAt}T00:00:00.000Z`);
    row.category = dto.category;
    row.tags = dto.tags;
    row.views = dto.views;
    row.likes = dto.likes;
    row.comments = dto.comments;
    row.author = dto.author;
    row.coverImage = dto.coverImage;
    row.contentMarkdown = dto.contentMarkdown;
    row.contentHtml = dto.contentHtml ?? null;
    const saved = await this.articleRepo.save(row);
    return toAdminArticle(saved);
  }

  async remove(id: string) {
    const res = await this.articleRepo.delete({ id });
    if (!res.affected) {
      throw new NotFoundException('文章不存在');
    }
  }
}

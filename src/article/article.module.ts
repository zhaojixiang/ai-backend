import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminArticlesController } from './admin-articles.controller';
import { Article } from './article.entity';
import { ArticleService } from './article.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article])],
  controllers: [AdminArticlesController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}

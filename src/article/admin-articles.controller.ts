import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ResponseMessage } from '../common/response-message.decorator';
import { ArticleService } from './article.service';
import { ArticleWriteDto } from './dto/article-write.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';

@Controller('admin/articles')
export class AdminArticlesController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  list(@Query() query: QueryArticlesDto) {
    return this.articleService.findPage(query);
  }

  @Post()
  @ResponseMessage('创建成功')
  create(@Body() body: ArticleWriteDto) {
    return this.articleService.create(body);
  }

  @Put(':id')
  @ResponseMessage('更新成功')
  update(@Param('id') id: string, @Body() body: ArticleWriteDto) {
    return this.articleService.update(id, body);
  }

  @Delete(':id')
  @ResponseMessage('删除成功')
  async remove(@Param('id') id: string) {
    await this.articleService.remove(id);
  }
}

import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

/** POST / PUT 请求体：与 AdminArticle 字段一致；POST 可无 id */
export class ArticleWriteDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  excerpt!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'publishedAt 须为 YYYY-MM-DD' })
  publishedAt!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  views!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  likes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  comments!: number;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsNotEmpty()
  coverImage!: string;

  @IsString()
  @IsNotEmpty()
  contentMarkdown!: string;

  @IsOptional()
  @IsString()
  contentHtml?: string;
}

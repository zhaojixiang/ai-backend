import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: 'text' })
  excerpt!: string;

  @Column({ type: 'date' })
  publishedAt!: Date;

  @Column({ length: 200 })
  category!: string;

  @Column({ type: 'json' })
  tags!: string[];

  @Column({ type: 'int', default: 0 })
  views!: number;

  @Column({ type: 'int', default: 0 })
  likes!: number;

  @Column({ type: 'int', default: 0 })
  comments!: number;

  @Column({ length: 200 })
  author!: string;

  @Column({ type: 'text' })
  coverImage!: string;

  @Column({ type: 'longtext' })
  contentMarkdown!: string;

  @Column({ type: 'longtext', nullable: true })
  contentHtml!: string | null;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt!: Date;
}

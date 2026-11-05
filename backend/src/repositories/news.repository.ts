import { db } from "../config/database";

type QueryExecutor = { query: typeof db.query };

export interface NewsArticleRow {
  id: string;
  topic: string;
  title_rw: string | null;
  title_en: string | null;
  title_fr: string | null;
  summary: string;
  body_rw: string | null;
  body_en: string | null;
  body_fr: string | null;
  image_url: string | null;
  read_time: string;
  target_districts: string[] | null;
  author_name: string;
  is_published: boolean;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNewsArticleInput {
  topic: string;
  titleRw?: string | null;
  titleEn?: string | null;
  titleFr?: string | null;
  summary: string;
  bodyRw?: string | null;
  bodyEn?: string | null;
  bodyFr?: string | null;
  imageUrl?: string | null;
  readTime?: string;
  targetDistricts?: string[] | null;
  authorName?: string;
  isPublished?: boolean;
}

const NEWS_COLUMNS = `
  id, topic, title_rw, title_en, title_fr, summary, body_rw, body_en, body_fr,
  image_url, read_time, target_districts, author_name, is_published,
  published_at, created_at, updated_at
`;

export class NewsRepository {
  async create(input: CreateNewsArticleInput, executor: QueryExecutor = db): Promise<NewsArticleRow> {
    const result = await executor.query(
      `
      INSERT INTO news_articles (
        topic, title_rw, title_en, title_fr, summary,
        body_rw, body_en, body_fr, image_url, read_time,
        target_districts, author_name, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING ${NEWS_COLUMNS}
      `,
      [
        input.topic,
        input.titleRw ?? null,
        input.titleEn ?? null,
        input.titleFr ?? null,
        input.summary,
        input.bodyRw ?? null,
        input.bodyEn ?? null,
        input.bodyFr ?? null,
        input.imageUrl ?? null,
        input.readTime ?? '3 min',
        input.targetDistricts ?? null,
        input.authorName ?? 'GuraAha Insights team',
        input.isPublished ?? true,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string, executor: QueryExecutor = db): Promise<NewsArticleRow | null> {
    const result = await executor.query(
      `SELECT ${NEWS_COLUMNS} FROM news_articles WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async findPublished(
    filters: { topic?: string; district?: string; limit: number; offset: number },
    executor: QueryExecutor = db
  ): Promise<NewsArticleRow[]> {
    const conditions = ['is_published = TRUE'];
    const params: unknown[] = [];

    if (filters.topic && filters.topic !== 'All') {
      params.push(filters.topic);
      conditions.push(`topic = $${params.length}`);
    }

    if (filters.district) {
      params.push(filters.district);
      conditions.push(`(target_districts IS NULL OR $${params.length} = ANY(target_districts))`);
    }

    params.push(filters.limit);
    const limitIdx = params.length;
    params.push(filters.offset);
    const offsetIdx = params.length;

    const result = await executor.query(
      `
      SELECT ${NEWS_COLUMNS}
      FROM news_articles
      WHERE ${conditions.join(' AND ')}
      ORDER BY published_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      params
    );
    return result.rows;
  }

  async countPublished(
    filters: { topic?: string; district?: string },
    executor: QueryExecutor = db
  ): Promise<number> {
    const conditions = ['is_published = TRUE'];
    const params: unknown[] = [];

    if (filters.topic && filters.topic !== 'All') {
      params.push(filters.topic);
      conditions.push(`topic = $${params.length}`);
    }

    if (filters.district) {
      params.push(filters.district);
      conditions.push(`(target_districts IS NULL OR $${params.length} = ANY(target_districts))`);
    }

    const result = await executor.query(
      `SELECT COUNT(*)::int AS count FROM news_articles WHERE ${conditions.join(' AND ')}`,
      params
    );
    return result.rows[0].count as number;
  }
}

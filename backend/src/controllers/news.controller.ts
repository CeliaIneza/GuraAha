import { Request, Response } from "express";
import { NewsService } from "../services/news.service";
import { NotificationService } from "../services/notification.service";
import { db } from "../config/database";

const SAMPLE_NEWS_IMAGES = [
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=60&auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=60&auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=60&auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=60&auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=60&auto=format&fit=crop&w=1200",
  "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=60&auto=format&fit=crop&w=1200",
];

export class NewsController {
  private readonly notificationService = new NotificationService();

  constructor(private readonly newsService: NewsService = new NewsService()) {}

  getArticles = async (req: Request, res: Response) => {
    try {
      const { topic, district, page, limit } = req.query;
      const result = await this.newsService.getPublishedArticles({
        topic: typeof topic === "string" ? topic : undefined,
        district: typeof district === "string" ? district : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve news articles",
      });
    }
  };

  getAllAdmin = async (_req: Request, res: Response) => {
    try {
      const { rows } = await db.query(
        `SELECT * FROM news_articles ORDER BY published_at DESC, created_at DESC LIMIT 100`
      );
      return res.status(200).json({ data: rows });
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve admin articles",
      });
    }
  };

  getArticle = async (req: Request, res: Response) => {
    try {
      const article = await this.newsService.getArticleById(String(req.params.id));
      return res.status(200).json({ data: article });
    } catch (error) {
      return res.status(404).json({
        message: error instanceof Error ? error.message : "Article not found",
      });
    }
  };

  adminPublish = async (req: Request, res: Response) => {
    try {
      const result = await this.newsService.adminPublishAndNotify(req.body);
      return res.status(201).json({
        message: "Article published and notifications dispatched successfully",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to publish article",
      });
    }
  };

  adminSave = async (req: Request, res: Response) => {
    try {
      const {
        id,
        topic,
        titleEn,
        titleRw,
        titleFr,
        summary,
        bodyEn,
        bodyRw,
        bodyFr,
        imageUrl,
        readTime,
        audience,
        targetDistricts,
        isPublished,
        pushNow,
      } = req.body || {};

      const headline = titleEn || titleRw || titleFr;
      if (!headline || !summary) {
        return res.status(400).json({ message: "Headline and summary are required" });
      }

      const districts = Array.isArray(targetDistricts)
        ? targetDistricts
        : targetDistricts
        ? [String(targetDistricts)]
        : ["All of Rwanda"];
      const pubFlag = isPublished !== undefined ? Boolean(isPublished) : true;
      const img =
        imageUrl || SAMPLE_NEWS_IMAGES[Math.floor(Math.random() * SAMPLE_NEWS_IMAGES.length)];

      let saved;
      if (id) {
        const { rows } = await db.query(
          `
          UPDATE news_articles
          SET
            topic = COALESCE($1, topic),
            title_en = COALESCE($2, title_en),
            title_rw = COALESCE($3, title_rw),
            title_fr = COALESCE($4, title_fr),
            summary = COALESCE($5, summary),
            body_en = COALESCE($6, body_en),
            body_rw = COALESCE($7, body_rw),
            body_fr = COALESCE($8, body_fr),
            image_url = COALESCE($9, image_url),
            read_time = COALESCE($10, read_time),
            audience = COALESCE($11, audience),
            target_districts = $12,
            is_published = $13,
            updated_at = NOW()
          WHERE id = $14
          RETURNING *
          `,
          [
            topic || "Market",
            titleEn || headline,
            titleRw || headline,
            titleFr || headline,
            summary,
            bodyEn || summary,
            bodyRw || bodyEn || summary,
            bodyFr || bodyEn || summary,
            img,
            readTime || "2 min",
            audience || "Everyone",
            districts,
            pubFlag,
            id,
          ]
        );
        saved = rows[0];
      } else {
        const { rows } = await db.query(
          `
          INSERT INTO news_articles (
            topic, title_en, title_rw, title_fr, summary,
            body_en, body_rw, body_fr, image_url, read_time,
            audience, target_districts, author_name, is_published, is_pushed
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Guraaha Insights team', $13, $14)
          RETURNING *
          `,
          [
            topic || "Market",
            titleEn || headline,
            titleRw || headline,
            titleFr || headline,
            summary,
            bodyEn || summary,
            bodyRw || bodyEn || summary,
            bodyFr || bodyEn || summary,
            img,
            readTime || "2 min",
            audience || "Everyone",
            districts,
            pubFlag,
            Boolean(pushNow && pubFlag),
          ]
        );
        saved = rows[0];
      }

      if (pushNow && saved?.is_published) {
        await this.pushNotificationForArticle(saved);
      }

      await db
        .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
          req.user?.id ?? null,
          `${id ? "💾 Article updated" : "➕ Article added"}: "${headline}"${saved.is_published ? "" : " (draft)"}${pushNow && saved.is_published ? " — notification sent" : ""}`,
        ])
        .catch(() => {});

      return res.status(id ? 200 : 201).json({ message: "Article saved", data: saved });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to save article",
      });
    }
  };

  togglePublish = async (req: Request, res: Response) => {
    try {
      const articleId = String(req.params.id);
      const { rows } = await db.query(
        `
        UPDATE news_articles
        SET is_published = NOT is_published, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [articleId]
      );
      const updated = rows[0];
      if (!updated) return res.status(404).json({ message: "Article not found" });

      const title = updated.title_en || updated.title_rw || updated.title_fr || "Article";
      await db
        .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
          req.user?.id ?? null,
          updated.is_published
            ? `📰 "${title}" published on the News page`
            : `📝 "${title}" unpublished — back to draft`,
        ])
        .catch(() => {});

      return res.status(200).json({ message: "Publish status updated", data: updated });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to toggle publish status",
      });
    }
  };

  pushArticle = async (req: Request, res: Response) => {
    try {
      const articleId = String(req.params.id);
      const { rows } = await db.query(
        `UPDATE news_articles SET is_pushed = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [articleId]
      );
      const article = rows[0];
      if (!article) return res.status(404).json({ message: "Article not found" });

      await this.pushNotificationForArticle(article);

      const title = article.title_en || article.title_rw || article.title_fr || "Article";
      await db
        .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
          req.user?.id ?? null,
          `📣 "${title}" pushed to subscribers`,
        ])
        .catch(() => {});

      return res.status(200).json({ message: "Article notification pushed", data: article });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to push article notification",
      });
    }
  };

  deleteArticle = async (req: Request, res: Response) => {
    try {
      const articleId = String(req.params.id);
      const { rows } = await db.query(
        `DELETE FROM news_articles WHERE id = $1 RETURNING *`,
        [articleId]
      );
      const deleted = rows[0];
      if (!deleted) return res.status(404).json({ message: "Article not found" });

      const title = deleted.title_en || deleted.title_rw || deleted.title_fr || "Article";
      await db
        .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
          req.user?.id ?? null,
          `🗑 Article "${title}" deleted`,
        ])
        .catch(() => {});

      return res.status(200).json({ message: "Article deleted", data: deleted });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to delete article",
      });
    }
  };

  private async pushNotificationForArticle(article: any) {
    const title = article.title_en || article.title_rw || article.title_fr || "Market Update";
    const icon = String(article.topic || "").toLowerCase().includes("vip") ? "⭐" : "📰";
    await db
      .query(
        `INSERT INTO notifications (user_id, icon, title, summary, action_type, action_id) VALUES (NULL, $1, $2, $3, 'NEWS', $4)`,
        [icon, title, article.summary, article.id]
      )
      .catch(() => {});
  }
}

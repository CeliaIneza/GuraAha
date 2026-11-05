import { Request, Response } from "express";
import { NewsService } from "../services/news.service";

export class NewsController {
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
}

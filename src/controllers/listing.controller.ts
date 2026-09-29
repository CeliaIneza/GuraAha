import { Request, Response } from "express";
import { ListingService } from "../services/listing.service";

export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  create = async (req: Request, res: Response) => {
    try {
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to submit listing",
      });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
    } catch (error) {
      return res.status(404).json({
        message: error instanceof Error ? error.message : "Listing not found",
      });
    }
  };

  getMine = async (req: Request, res: Response) => {
    try {
      const listings = await this.listingService.getMine(req.user.id);
      return res.status(200).json({ data: listings });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve your listings",
      });
    }
  };

  getPending = async (_req: Request, res: Response) => {
    try {
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve pending listings",
      });
    }
  };

  getApproved = async (req: Request, res: Response) => {
    try {
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve listings",
      });
    }
  };

  approve = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.approve(
        req.params.id,
        req.user.id,
      );

      return res.status(200).json({
        message: "Listing approved successfully",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to approve listing",
      });
    }
  };

  reject = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.reject(
        req.params.id,
        req.user.id,
        req.body.rejectionReason,
      );
      return res.status(200).json({
        message: "Listing rejected",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to reject listing",
      });
    }
  };

  addPhoto = async (req: Request, res: Response) => {
    try {
      const photo = await this.listingService.addPhoto(
        req.params.id,
        req.user.id,
        req.body.filePath,
        req.body.sortOrder,
      );
      return res.status(201).json({ message: "Photo added", data: photo });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to add photo",
      });
    }
  };

  getPhotos = async (req: Request, res: Response) => {
    try {
      const photos = await this.listingService.getPhotos(req.params.id);
      return res.status(200).json({ data: photos });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to retrieve photos",
      });
    }
  };

  removePhoto = async (req: Request, res: Response) => {
    try {
      await this.listingService.removePhoto(req.params.photoId, req.user.id);
      return res.status(200).json({ message: "Photo removed" });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to remove photo",
      });
    }
  };
}

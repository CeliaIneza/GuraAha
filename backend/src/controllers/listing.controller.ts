import { Request, Response } from "express";
import { ListingService } from "../services/listing.service";
import { toPublicUploadPath } from "../utils/uploadpath.util";

export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  create = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.create(req.user!.id, req.body);
      return res.status(201).json({
        message: "Listing submitted successfully",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to submit listing",
      });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.getById(
        req.params.id as string,
        req.user,
      );
      return res.status(200).json({ data: listing });
    } catch (error) {
      return res.status(404).json({
        message: error instanceof Error ? error.message : "Listing not found",
      });
    }
  };

  getMine = async (req: Request, res: Response) => {
    try {
      const listings = await this.listingService.getMine(req.user!.id);
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
      const listings = await this.listingService.getPendingForAdmin();
      return res.status(200).json({ data: listings });
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
      const { villageId, locationId, type, maxPriceRwf, page, pageSize } = req.query;
      const listings = await this.listingService.getApproved({
        villageId: typeof villageId === "string" ? villageId : undefined,
        locationId: typeof locationId === "string" ? locationId : undefined,
        type: typeof type === "string" ? type : undefined,
        maxPriceRwf: maxPriceRwf ? Number(maxPriceRwf) : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });
      return res.status(200).json({ data: listings });
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
        req.params.id as string,
        req.user!.id,
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
        req.params.id as string,
        req.user!.id,
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
      if (!req.file) {
        return res.status(400).json({ message: "Photo file is required" });
      }

      const photo = await this.listingService.addPhoto(
        req.params.id as string,
        req.user!.id,
        toPublicUploadPath("listings", req.file.filename),
        req.body.sortOrder ? Number(req.body.sortOrder) : undefined,
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
      const photos = await this.listingService.getPhotos(req.params.id as string);
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
      await this.listingService.removePhoto(req.params.photoId as string, req.user!.id);
      return res.status(200).json({ message: "Photo removed" });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to remove photo",
      });
    }
  };
}

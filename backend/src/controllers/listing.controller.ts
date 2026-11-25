import { Request, Response } from "express";
import { ListingService } from "../services/listing.service";

export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  create = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.create(
        req.user.id,
        req.body,
        req.user.role
      );
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
      const id = String(req.params.id || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(404).json({ message: "Listing not found" });
      }
      const listing = await this.listingService.getById(id, req.user);
      return res.status(200).json({ data: listing });
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

  getPendingVip = async (_req: Request, res: Response) => {
    try {
      const listings = await this.listingService.getPendingVipForAdmin();
      return res.status(200).json({ data: listings });
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve pending VIP listings",
      });
    }
  };

  getApproved = async (req: Request, res: Response) => {
    try {
      const {
        villageId,
        locationId,
        type,
        category,
        subType,
        deal,
        featured,
        sort,
        maxPriceRwf,
        maxPrice,
        minPriceRwf,
        minPrice,
        page,
        pageSize,
      } = req.query;
      const maxP = maxPriceRwf ?? maxPrice;
      const minP = minPriceRwf ?? minPrice;

      const listings = await this.listingService.getApproved(
        {
          villageId: typeof villageId === "string" && villageId ? villageId : undefined,
          locationId: typeof locationId === "string" && locationId ? locationId : undefined,
          type: typeof type === "string" && type ? type : undefined,
          category: typeof category === "string" && category ? category : undefined,
          subType: typeof subType === "string" && subType ? subType : undefined,
          deal: typeof deal === "string" && deal ? deal : undefined,
          isFeatured: featured === "true" ? true : featured === "false" ? false : undefined,
          sort: typeof sort === "string" && sort ? sort : undefined,
          maxPriceRwf: maxP ? Number(maxP) : undefined,
          minPriceRwf: minP ? Number(minP) : undefined,
          page: page ? Number(page) : undefined,
          pageSize: pageSize ? Number(pageSize) : undefined,
        },
        req.user?.id
      );
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

  getVipDeals = async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
      const pageSize = req.query.pageSize ? Math.min(50, Math.max(1, Number(req.query.pageSize))) : 20;
      const listings = await this.listingService.getVipDeals({ page, pageSize });
      return res.status(200).json({ data: listings });
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve VIP deals",
      });
    }
  };

  approve = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.approve(
        String(req.params.id),
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

  approveVip = async (req: Request, res: Response) => {
    try {
      const earlyAccessDays = req.body?.earlyAccessDays ? Number(req.body.earlyAccessDays) : 7;
      const listing = await this.listingService.approveVip(
        String(req.params.id),
        req.user.id,
        earlyAccessDays
      );
      return res.status(200).json({
        message: "VIP listing approved and alerts dispatched",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to approve VIP listing",
      });
    }
  };

  reject = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.reject(
        String(req.params.id),
        req.user.id,
        req.body.rejectionReason || req.body.adminNote || "Rejected by admin",
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

  revise = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.revise(
        String(req.params.id),
        req.user.id,
        req.body?.adminNote || req.body?.rejectionReason || "Revision requested by admin",
      );
      return res.status(200).json({
        message: "Revision requested on listing",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to request revision on listing",
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.update(
        String(req.params.id),
        req.user.id,
        req.body,
        req.user.role
      );
      return res.status(200).json({
        message: "Listing updated successfully",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to update listing",
      });
    }
  };

  toggleDisabled = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.toggleDisabled(
        String(req.params.id),
        req.user
      );
      return res.status(200).json({
        message: "Listing availability updated",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to toggle listing status",
      });
    }
  };

  toggleFeatured = async (req: Request, res: Response) => {
    try {
      const listing = await this.listingService.toggleFeatured(
        String(req.params.id),
        req.user.id
      );
      return res.status(200).json({
        message: listing.is_featured
          ? "Listing featured on homepage"
          : "Listing removed from featured",
        data: listing,
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to toggle featured status",
      });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.listingService.delete(String(req.params.id), req.user);
      return res.status(200).json({
        message: "Listing deleted successfully",
      });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to delete listing",
      });
    }
  };

  addPhoto = async (req: Request, res: Response) => {
    try {
      const photo = await this.listingService.addPhoto(
        String(req.params.id),
        req.user.id,
        req.body.filePath,
        req.body.sortOrder,
        req.user.role
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
      const id = String(req.params.id || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(200).json({ data: [] });
      }
      const photos = await this.listingService.getPhotos(id);
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
      await this.listingService.removePhoto(
        String(req.params.photoId),
        req.user.id,
        req.user.role
      );
      return res.status(200).json({ message: "Photo removed" });
    } catch (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to remove photo",
      });
    }
  };
}

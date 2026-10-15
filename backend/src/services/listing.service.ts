import { BlockerRepository } from "../repositories/blocker.repository";
import { ListingRepository } from "../repositories/listing.repository";
import { ListingPhotoRepository } from "../repositories/listingphoto.repository";
import { LocationRepository } from "../repositories/location.repository";
import { CreateListingInput } from "../validators/listing.validator";

interface RequestingUser {
    id: string;
    role: string;
}

export class ListingService {
    constructor(
        private readonly listingRepository: ListingRepository,
        private readonly listingPhotoRepository: ListingPhotoRepository,
        private readonly blockerRepository: BlockerRepository,
        private readonly locationRepository: LocationRepository
    ) {}

    async create(userId: string, input: CreateListingInput) {
        const blockerProfile = await this.blockerRepository.findByUserId(userId);

        if(!blockerProfile) {
            throw new Error('No blocker profile found for this user');
        }

        if (blockerProfile.status !== 'APPROVED') {
            throw new Error('Only approved blockers can create listings');
        }

        const village = await this.locationRepository.findById(input.villageId);

        if(!village) {
            throw new Error('Village not found');
        }

        if (village.level !== 'VILLAGE') {
            throw new Error('villageId must reference a location at the VILLAGE level');
        }

        if(input.upiNumber) {
            const existing = await this.listingRepository.findActiveByUpiNumber(input.upiNumber);

            if(existing) {
                throw new Error('An active listing already existings for this UPI number');
            }
        }

        const created = await this.listingRepository.create({
            blockerId: blockerProfile.id,
            villageId: input.villageId,
            type: input.type,
            titleRw: input.titleRw,
            titleEn: input.titleEn,
            titleFr: input.titleFr,
            descriptionRw: input.descriptionRw,
            descriptionEn: input.descriptionEn,
            descriptionFr: input.descriptionFr,
            priceRwf: input.priceRwf,
            sizeValue: input.sizeValue,
            sizeUnit: input.sizeUnit,
            upiNumber: input.upiNumber,
            ownerName: input.ownerName,
            ownerPhone: input.ownerPhone,
            ownershipDocumentPath: input.ownershipDocumentPath
        });

        return this.presentListing(
            await this.listingRepository.findByIdWithContext(created.id),
            { includeSensitive: true }
        );
    }


    async getById(listingId: string, requestingUser?: RequestingUser) {
        const listing = await this.listingRepository.findByIdWithContext(listingId);

        if(!listing) {
            throw new Error('Listing not found');
        }

        const isOwner = requestingUser?.id === listing.owner_user_id;
        const isAdmin = requestingUser?.role === 'ADMIN';
        const isPublicVisible = listing.status === 'APPROVED';

        if(!isPublicVisible && !isOwner && !isAdmin) {
            throw new Error('Listing not found');
        }

        return this.presentListing(listing, { includeSensitive: Boolean(isOwner || isAdmin) });
    }


    async getMine(userId: string) {
        const blockerProfile = await this.blockerRepository.findByUserId(userId);

        if(!blockerProfile) {
            throw new Error('No blocker profile found for this user');
        }

        const listings = await this.listingRepository.findByBlockerId(blockerProfile.id);
        return listings.map((listing) => this.presentListing(listing, { includeSensitive: true }));
    }


    async getPendingForAdmin() {
        const listings = await this.listingRepository.findPending();
        return listings.map((listing) => this.presentListing(listing, { includeSensitive: true }));
    }


    async getApproved(filters: {
        locationId?: string;
        villageId?: string;
        type?: string;
        maxPriceRwf?: number;
        page?: number;
        pageSize?: number;
    }) {
        const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
        const page = Math.max(filters.page ?? 1, 1);

        const listings = await this.listingRepository.findApproved({
            locationId: filters.locationId,
            villageId: filters.villageId,
            type: filters.type,
            maxPriceRwf: filters.maxPriceRwf,
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });

        return listings.map((listing) => this.presentListing(listing, { includeSensitive: false }));
    }


    async approve(listingId: string, adminId: string) {
        const listing = await this.listingRepository.findById(listingId);

        if (!listing) {
            throw new Error('Listing not found');
        }

        if (listing.status !== 'PENDING') {
            throw new Error('Only pending listings can be approved');
        }

        await this.listingRepository.approve(listingId, adminId);
        return this.presentListing(
            await this.listingRepository.findByIdWithContext(listingId),
            { includeSensitive: true }
        );
    }


    async reject(listingId: string, adminId: string, rejectionReason: string) {
    const listing = await this.listingRepository.findById(listingId);
 
    if (!listing) {
      throw new Error('Listing not found');
    }
 
    if (listing.status !== 'PENDING') {
      throw new Error('Only pending listings can be rejected');
    }
 
    await this.listingRepository.reject(listingId, adminId, rejectionReason);
    return this.presentListing(
      await this.listingRepository.findByIdWithContext(listingId),
      { includeSensitive: true }
    );
  }
 
  async addPhoto(listingId: string, userId: string, filePath: string, sortOrder?: number) {
    const listing = await this.listingRepository.findByIdWithOwner(listingId);
 
    if (!listing) {
      throw new Error('Listing not found');
    }
 
    if (listing.owner_user_id !== userId) {
      throw new Error('You do not own this listing');
    }
 
    return this.listingPhotoRepository.create({ listingId, filePath, sortOrder });
  }
 
  async getPhotos(listingId: string) {
    const photos = await this.listingPhotoRepository.findByListingId(listingId);
    return photos.map((photo) => ({
      id: photo.id,
      listingId: photo.listing_id,
      filePath: photo.file_path,
      sortOrder: photo.sort_order,
      createdAt: photo.created_at,
    }));
  }
 
  async removePhoto(photoId: string, userId: string) {
    const photo = await this.listingPhotoRepository.findById(photoId);
 
    if (!photo) {
      throw new Error('Photo not found');
    }
 
    const listing = await this.listingRepository.findByIdWithOwner(photo.listing_id);
 
    if (!listing || listing.owner_user_id !== userId) {
      throw new Error('You do not own this listing');
    }
 
    return this.listingPhotoRepository.deleteById(photoId);
  }

  private presentListing(
    listing: Record<string, unknown> | null,
    options: { includeSensitive: boolean }
  ) {
    if (!listing) {
      return listing;
    }

    const presented: Record<string, unknown> = {
      id: listing.id,
      blockerId: listing.blocker_id,
      villageId: listing.village_id,
      type: listing.type,
      titleRw: listing.title_rw,
      titleEn: listing.title_en,
      titleFr: listing.title_fr,
      descriptionRw: listing.description_rw,
      descriptionEn: listing.description_en,
      descriptionFr: listing.description_fr,
      priceRwf: listing.price_rwf === null ? null : Number(listing.price_rwf),
      sizeValue: listing.size_value === null ? null : Number(listing.size_value),
      sizeUnit: listing.size_unit,
      upiNumber: listing.upi_number,
      status: listing.status,
      rejectionReason: listing.rejection_reason,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      coverPhotoPath: listing.cover_photo_path ?? null,
      location: {
        villageId: listing.village_id,
        village: listing.village_name,
        cell: listing.cell_name,
        sector: listing.sector_name,
        district: listing.district_name,
        province: listing.province_name,
      },
      blocker: {
        firstName: listing.blocker_first_name,
        lastName: listing.blocker_last_name,
        verificationCode: listing.blocker_code ?? null,
      },
    };

    if (options.includeSensitive) {
      presented.ownerName = listing.owner_name ?? null;
      presented.ownerPhone = listing.owner_phone ?? null;
      presented.ownershipDocumentPath = listing.ownership_document_path ?? null;
    }

    return presented;
  }
}
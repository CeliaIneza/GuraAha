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

        return this.listingRepository.create({
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
            ownerPhone: input.ownerName,
            ownershipDocumentPath: input.ownershipDocumentPath
        });
    }


    async getById(listingId: string, requestingUser?: RequestingUser) {
        const listing = await this.listingRepository.findByIdWithOwner(listingId);

        if(!listing) {
            throw new Error('Listing not found');
        }

        const isOwner = requestingUser?.id === listing.owner_user_id;
        const isAdmin = requestingUser?.role === 'ADMIN';
        const isPublicVisible = listing.status === 'APPROVED';

        if(!isPublicVisible && !isOwner && !isAdmin) {
            throw new Error('Listing not found');
        }

        return listing;
    }


    async getMine(userId: string) {
        const blockerProfile = await this.blockerRepository.findByUserId(userId);

        if(!blockerProfile) {
            throw new Error('No blocker profile found for this user');
        }

        return this.listingRepository.findByBlockerId(blockerProfile.id);
    }


    async getPendingForAdmin() {
        return this.listingRepository.findPending();
    }


    async getApproved(filters: { villageId?: string; type?: string; page?: number; pageSize?: number }) {
        const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
        const page = Math.max(filters.page ?? 1, 1);

        return this.listingRepository.findApproved({
            villageId: filters.villageId,
            type: filters.type,
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });
    }


    async approve(listingId: string, adminId: string) {
        const listing = await this.listingRepository.findById(listingId);

        if (!listing) {
            throw new Error('Listing not found');
        }

        if (listing.status !== 'PENDING') {
            throw new Error('Only pending listings can be approved');
        }

        return this.listingRepository.approve(listingId, adminId);
    }


    async reject(listingId: string, adminId: string, rejectionReason: string) {
    const listing = await this.listingRepository.findById(listingId);
 
    if (!listing) {
      throw new Error('Listing not found');
    }
 
    if (listing.status !== 'PENDING') {
      throw new Error('Only pending listings can be rejected');
    }
 
    return this.listingRepository.reject(listingId, adminId, rejectionReason);
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
    return this.listingPhotoRepository.findByListingId(listingId);
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
}
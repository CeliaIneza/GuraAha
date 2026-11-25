import fs from "node:fs/promises";
import path from "node:path";
import { BlockerRepository } from "../repositories/blocker.repository";
import { ListingRepository, UpdateListingInput } from "../repositories/listing.repository";
import { ListingPhotoRepository } from "../repositories/listingphoto.repository";
import { LocationRepository } from "../repositories/location.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { NotificationService } from "./notification.service";
import { CreateListingInput } from "../validators/listing.validator";
import { UPLOAD_ROOT } from "../middleware/upload";
import { db } from "../config/database";

interface RequestingUser {
    id: string;
    role: string;
}

function sanitizePublicListing(listing: any, includeSensitive: boolean = false) {
    if (!listing) return listing;
    const hasOwnerContact = Boolean(
        (listing.owner_phone && String(listing.owner_phone).trim()) ||
        (listing.ownerPhone && String(listing.ownerPhone).trim()) ||
        listing.has_owner_contact === true ||
        listing.hasOwnerContact === true
    );
    const copy = {
        ...listing,
        coverPhotoPath: listing.cover_photo_path ?? listing.coverPhotoPath ?? null,
        has_owner_contact: hasOwnerContact,
        hasOwnerContact,
    };
    if (!includeSensitive) {
        delete copy.owner_name;
        delete copy.owner_phone;
        delete copy.ownership_document_path;
        delete copy.ownerName;
        delete copy.ownerPhone;
        delete copy.ownershipDocumentPath;
    }
    return copy;
}

export class ListingService {
    constructor(
        private readonly listingRepository: ListingRepository,
        private readonly listingPhotoRepository: ListingPhotoRepository,
        private readonly blockerRepository: BlockerRepository,
        private readonly locationRepository: LocationRepository,
        private readonly subscriptionRepository: SubscriptionRepository = new SubscriptionRepository(),
        private readonly notificationService: NotificationService = new NotificationService()
    ) {}

    async create(userId: string, input: CreateListingInput, userRole = 'BLOCKER') {
        let blockerId = input.blockerId;
        if (userRole === 'ADMIN') {
            if (!blockerId) {
                const anyBlocker = await db.query(
                    `SELECT id FROM blocker_profiles WHERE status = 'APPROVED' ORDER BY created_at ASC LIMIT 1`
                );
                if (!anyBlocker.rows[0]) {
                    throw new Error('At least one approved blocker must exist to assign this listing');
                }
                blockerId = anyBlocker.rows[0].id;
            }
        } else {
            const blockerProfile = await this.blockerRepository.findByUserId(userId);
            if (!blockerProfile) {
                throw new Error('No blocker profile found for this user');
            }
            if (blockerProfile.status !== 'APPROVED') {
                throw new Error('Only approved blockers can create listings');
            }
            blockerId = blockerProfile.id;
        }

        let villageId = input.villageId;
        if (villageId) {
            const village = await this.locationRepository.findById(villageId);
            if (!village || village.level !== 'VILLAGE') {
                const fallbackVil = await db.query(
                    `SELECT id FROM locations WHERE level = 'VILLAGE' AND is_active = TRUE LIMIT 1`
                );
                villageId = fallbackVil.rows[0]?.id;
            }
        } else {
            const fallbackVil = await db.query(
                `SELECT id FROM locations WHERE level = 'VILLAGE' AND is_active = TRUE LIMIT 1`
            );
            villageId = fallbackVil.rows[0]?.id;
        }

        if (!villageId) {
            throw new Error('Village not found');
        }

        if (input.upiNumber) {
            const existing = await this.listingRepository.findActiveByUpiNumber(input.upiNumber);
            if (existing) {
                throw new Error('An active listing already exists for this UPI number');
            }
        }

        const effectiveCategory = input.category || input.type || 'Land and Plots';
        const effectiveSubType = input.subType || input.type || effectiveCategory;

        const created = await this.listingRepository.create({
            blockerId: blockerId!,
            villageId,
            type: effectiveSubType,
            category: effectiveCategory,
            subType: effectiveSubType,
            condition: input.condition || 'Ready / finished',
            deal: input.deal || 'sale',
            rentalTerms: input.rentalTerms ?? null,
            titleRw: input.titleRw,
            titleEn: input.titleEn,
            titleFr: input.titleFr,
            descriptionRw: input.descriptionRw,
            descriptionEn: input.descriptionEn,
            descriptionFr: input.descriptionFr,
            priceRwf: input.priceRwf,
            sizeValue: input.sizeValue,
            sizeUnit: input.sizeUnit || 'sqm',
            upiNumber: input.upiNumber ?? null,
            ownerName: input.ownerName ?? null,
            ownerPhone: input.ownerPhone ?? null,
            ownershipDocumentPath: input.ownershipDocumentPath ?? null,
            status: userRole === 'ADMIN' ? (input.status || 'APPROVED').toUpperCase() : 'PENDING',
            isFeatured: userRole === 'ADMIN' ? Boolean(input.isFeatured) : false,
            isDisabled: userRole === 'ADMIN' ? Boolean(input.isDisabled) : false,
            isVip: input.isVip,
            vipWasPriceRwf: input.vipWasPriceRwf ?? null,
            vipDiscountPercent: input.vipDiscountPercent ?? null,
            vipReason: input.vipReason ?? null,
            vipEarlyAccessDays: input.vipEarlyAccessDays ?? 7,
        });

        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                userId,
                `➕ Listing "${created.title_en || created.title_rw || created.title_fr}" created (${created.status})`,
            ])
            .catch(() => {});

        return created;
    }

    async getById(listingId: string, requestingUser?: RequestingUser) {
        const listing = await this.listingRepository.findByIdWithOwner(listingId);

        if (!listing) {
            throw new Error('Listing not found');
        }

        const isOwner = Boolean(requestingUser?.id && requestingUser.id === listing.owner_user_id);
        const isAdmin = requestingUser?.role === 'ADMIN';
        const isPublicVisible =
            listing.status === 'APPROVED' &&
            !listing.is_disabled &&
            listing.blocker_status !== 'SUSPENDED';

        if (!isPublicVisible && !isOwner && !isAdmin) {
            throw new Error('Listing not found');
        }

        const photos = await this.listingPhotoRepository.findByListingId(listingId);
        const enriched = {
            ...listing,
            photos,
            cover_photo_path: listing.cover_photo_path ?? photos[0]?.file_path ?? null,
        };

        return sanitizePublicListing(enriched, isOwner || isAdmin);
    }

    async getMine(userId: string) {
        const blockerProfile = await this.blockerRepository.findByUserId(userId);

        if (!blockerProfile) {
            throw new Error('No blocker profile found for this user');
        }

        const rows = await this.listingRepository.findByBlockerId(blockerProfile.id);
        return rows.map((row) => sanitizePublicListing(row, true));
    }

    async getPendingForAdmin() {
        const rows = await this.listingRepository.findPending();
        return rows.map((row) => sanitizePublicListing(row, true));
    }

    async getPendingVipForAdmin() {
        const rows = await this.listingRepository.findPendingVip();
        return rows.map((row) => sanitizePublicListing(row, true));
    }

    async getApproved(
        filters: {
            villageId?: string;
            locationId?: string;
            type?: string;
            category?: string;
            subType?: string;
            deal?: string;
            isFeatured?: boolean;
            sort?: string;
            maxPriceRwf?: number;
            minPriceRwf?: number;
            page?: number;
            pageSize?: number;
        },
        userId?: string
    ) {
        const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 1), 100);
        const page = Math.max(filters.page ?? 1, 1);

        const isVipUser = userId ? await this.subscriptionRepository.hasActiveVip(userId) : false;

        const rows = await this.listingRepository.findApproved(
            {
                villageId: filters.villageId,
                locationId: filters.locationId,
                type: filters.type,
                category: filters.category,
                subType: filters.subType,
                deal: filters.deal,
                isFeatured: filters.isFeatured,
                sort: filters.sort,
                maxPrice: filters.maxPriceRwf,
                minPrice: filters.minPriceRwf,
                limit: pageSize,
                offset: (page - 1) * pageSize,
            },
            isVipUser
        );
        return rows.map((row) => sanitizePublicListing(row, false));
    }

    async getVipDeals(filters: { page?: number; pageSize?: number }) {
        const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
        const page = Math.max(filters.page ?? 1, 1);
        const rows = await this.listingRepository.findVipDeals({
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });
        return rows.map((row) => sanitizePublicListing(row, false));
    }

    async approve(listingId: string, adminId: string) {
        const listing = await this.listingRepository.findById(listingId);

        if (!listing) {
            throw new Error('Listing not found');
        }

        if (listing.is_vip) {
            return this.approveVip(listingId, adminId, listing.vip_early_access_days ?? 7);
        }

        const approved = await this.listingRepository.approve(listingId, adminId);
        const title = listing.title_en || listing.title_rw || listing.title_fr || listingId;
        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                adminId,
                `✅ "${title}" approved live on the public site`,
            ])
            .catch(() => {});
        return approved;
    }

    async approveVip(listingId: string, adminId: string, earlyAccessDays: number = 7) {
        const listing = await this.listingRepository.findById(listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }
        const approved = await this.listingRepository.approveVip(listingId, adminId, earlyAccessDays);
        if (approved) {
            const title = listing.title_en || listing.title_rw || listing.title_fr || 'Exclusive VIP Property';
            const district = listing.location?.district;
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    adminId,
                    `⭐ "${title}" approved as VIP exclusive visible to VIP subscribers for ${earlyAccessDays} days`,
                ])
                .catch(() => {});
            this.notificationService
                .fanOutVipDealAlert({
                    listingId: approved.id,
                    title,
                    district,
                    discountPercent: approved.vip_discount_percent ? Number(approved.vip_discount_percent) : undefined,
                    priceRwf: Number(approved.price_rwf),
                    daysLeft: earlyAccessDays,
                })
                .catch((err) => console.error('Failed to fan out VIP deal alert:', err));
        }
        return approved;
    }

    async reject(listingId: string, adminId: string, rejectionReason: string) {
        const listing = await this.listingRepository.findById(listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }

        const rejected = await this.listingRepository.reject(listingId, adminId, rejectionReason);
        const title = listing.title_en || listing.title_rw || listing.title_fr || listingId;
        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                adminId,
                `❌ "${title}" rejected: ${rejectionReason}`,
            ])
            .catch(() => {});
        return rejected;
    }

    async revise(listingId: string, adminId: string, adminNote: string) {
        const listing = await this.listingRepository.findById(listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }
        return this.listingRepository.revise(
            listingId,
            adminId,
            adminNote || 'Revision requested by admin'
        );
    }

    async update(listingId: string, userId: string, input: UpdateListingInput, userRole = 'BLOCKER') {
        const isAdmin = userRole === 'ADMIN';
        let blockerId: string | null = null;
        if (!isAdmin) {
            const blockerProfile = await this.blockerRepository.findByUserId(userId);
            if (!blockerProfile) {
                throw new Error('No blocker profile found for this user');
            }
            blockerId = blockerProfile.id;
        }
        const updated = await this.listingRepository.update(listingId, blockerId, input, isAdmin);
        if (!updated) {
            throw new Error('Listing not found or you do not own this listing');
        }
        const title = updated.title_en || updated.title_rw || updated.title_fr || listingId;
        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                userId,
                `💾 Listing "${title}" updated${isAdmin ? ' by admin' : ''}`,
            ])
            .catch(() => {});
        return updated;
    }

    async toggleDisabled(listingId: string, user: RequestingUser) {
        if (user.role === 'ADMIN') {
            const updated = await this.listingRepository.toggleDisabled(listingId);
            if (!updated) throw new Error('Listing not found');
            const title = updated.title_en || updated.title_rw || updated.title_fr || listingId;
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    user.id,
                    updated.is_disabled
                        ? `⏸ "${title}" disabled hidden from the public site`
                        : `▶ "${title}" enabled live again`,
                ])
                .catch(() => {});
            return updated;
        }
        const blockerProfile = await this.blockerRepository.findByUserId(user.id);
        if (!blockerProfile) {
            throw new Error('No blocker profile found for this user');
        }
        const updated = await this.listingRepository.toggleDisabled(listingId, blockerProfile.id);
        if (!updated) {
            throw new Error('Listing not found or you do not own this listing');
        }
        return updated;
    }

    async toggleFeatured(listingId: string, adminId: string) {
        const updated = await this.listingRepository.toggleFeatured(listingId);
        if (!updated) throw new Error('Listing not found');
        const title = updated.title_en || updated.title_rw || updated.title_fr || listingId;
        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                adminId,
                updated.is_featured
                    ? `★ "${title}" featured on the home page`
                    : `☆ "${title}" removed from featured`,
            ])
            .catch(() => {});
        return updated;
    }

    async delete(listingId: string, user: RequestingUser) {
        const listing = await this.listingRepository.findByIdWithOwner(listingId);
        if (!listing) {
            throw new Error('Listing not found');
        }
        if (user.role !== 'ADMIN' && listing.owner_user_id !== user.id) {
            throw new Error('You do not have permission to delete this listing');
        }

        const photos = await this.listingPhotoRepository.findByListingId(listingId);
        const deleted = await this.listingRepository.deleteById(listingId);
        const title = listing.title_en || listing.title_rw || listing.title_fr || listingId;

        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                user.id,
                `🗑 Listing "${title}" deleted`,
            ])
            .catch(() => {});

        for (const photo of photos) {
            if (photo.file_path) {
                const diskPath = path.resolve(UPLOAD_ROOT, photo.file_path);
                if (diskPath.startsWith(UPLOAD_ROOT)) {
                    await fs.unlink(diskPath).catch(() => {});
                }
            }
        }

        return deleted;
    }

    async addPhoto(listingId: string, userId: string, filePath: string, sortOrder?: number, userRole = 'BLOCKER') {
        if (!filePath) {
            throw new Error('Photo file is required');
        }

        const listing = await this.listingRepository.findByIdWithOwner(listingId);

        if (!listing) {
            throw new Error('Listing not found');
        }

        if (userRole !== 'ADMIN' && listing.owner_user_id !== userId) {
            throw new Error('You do not own this listing');
        }

        return this.listingPhotoRepository.create({ listingId, filePath, sortOrder });
    }

    async getPhotos(listingId: string) {
        return this.listingPhotoRepository.findByListingId(listingId);
    }

    async removePhoto(photoId: string, userId: string, userRole = 'BLOCKER') {
        const photo = await this.listingPhotoRepository.findById(photoId);

        if (!photo) {
            throw new Error('Photo not found');
        }

        const listing = await this.listingRepository.findByIdWithOwner(photo.listing_id);

        if (!listing || (userRole !== 'ADMIN' && listing.owner_user_id !== userId)) {
            throw new Error('You do not own this listing');
        }

        await this.listingPhotoRepository.deleteById(photoId);

        if (photo.file_path) {
            const diskPath = path.resolve(UPLOAD_ROOT, photo.file_path);
            if (diskPath.startsWith(UPLOAD_ROOT)) {
                await fs.unlink(diskPath).catch(() => {});
            }
        }
    }
}

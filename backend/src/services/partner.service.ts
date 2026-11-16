import { PartnerRepository, PartnerDbRow } from "../repositories/partner.repository";
import { CreatePartnerInput, UpdatePartnerInput, PartnerQueryParams } from "../validators/partner.validator";

export interface FormattedPartner {
    id: string;
    type: string;
    name: string;
    phone: string | null;
    email: string | null;
    locationId: string | null;
    locationName?: string | null;
    locationLevel?: string | null;
    descriptionRw: string | null;
    descriptionEn: string | null;
    descriptionFr: string | null;
    isCertified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export function toPartnerView(row: PartnerDbRow): FormattedPartner {
    return {
        id: row.id,
        type: row.type,
        name: row.name,
        phone: row.phone,
        email: row.email,
        locationId: row.location_id,
        locationName: row.location_name,
        locationLevel: row.location_level,
        descriptionRw: row.description_rw,
        descriptionEn: row.description_en,
        descriptionFr: row.description_fr,
        isCertified: row.is_certified,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export class PartnerService {
    constructor(
        private readonly partnerRepository: PartnerRepository = new PartnerRepository()
    ) {}

    async listPartners(query: PartnerQueryParams, isAdmin: boolean = false) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const offset = (page - 1) * limit;

        // Public users only see active partners
        const isActiveFilter = isAdmin ? query.isActive : true;

        const { items, total } = await this.partnerRepository.findMany({
            type: query.type,
            locationId: query.locationId,
            isCertified: query.isCertified,
            isActive: isActiveFilter,
            search: query.search,
            limit,
            offset,
        });

        const totalPages = Math.ceil(total / limit) || 1;

        return {
            items: items.map(toPartnerView),
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }

    async getPartnerById(id: string, isAdmin: boolean = false): Promise<FormattedPartner> {
        const partner = await this.partnerRepository.findById(id);

        if (!partner) {
            throw new Error("Partner not found");
        }

        if (!isAdmin && !partner.is_active) {
            throw new Error("Partner not found");
        }

        return toPartnerView(partner);
    }

    async createPartner(input: CreatePartnerInput): Promise<FormattedPartner> {
        const created = await this.partnerRepository.create(input);
        return toPartnerView(created);
    }

    async updatePartner(id: string, input: UpdatePartnerInput): Promise<FormattedPartner> {
        const existing = await this.partnerRepository.findById(id);
        if (!existing) {
            throw new Error("Partner not found");
        }

        const updated = await this.partnerRepository.update(id, input);
        if (!updated) {
            throw new Error("Failed to update partner");
        }

        return toPartnerView(updated);
    }

    async deletePartner(id: string, hard: boolean = false): Promise<void> {
        const existing = await this.partnerRepository.findById(id);
        if (!existing) {
            throw new Error("Partner not found");
        }

        if (hard) {
            await this.partnerRepository.delete(id);
        } else {
            await this.partnerRepository.softDelete(id);
        }
    }
}

import { LocationRepository } from './../repositories/location.repository';

export class LocationService {
    constructor(private readonly locationRepository: LocationRepository) {}

    async getProvinces() {
        return this.locationRepository.findRoots();
    }

    async getChildren(parentId: string) {
        const parent = await this.locationRepository.findById(parentId);

        if(!parent) {
            throw new Error('Location not found');
        }

        if(parent.level==='VILLAGE') {
            throw new Error('Villages are the last level - they have no children');
        }

        return this.locationRepository.findChildren(parentId);
    }
}
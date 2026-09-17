import { BlockerRepository } from './../repositories/blocker.repository';
import { UserRepository } from '../repositories/user.repository';

export interface ApplyForBlockerInput {
    userId: string;
    nationalId: string;
    operatingLocationId?: string;
    verificationCode?: string;
    agreementDocumentPath?: string;
}

export class BlockerService {
    constructor(
        private readonly blockerRepository: BlockerRepository,
        private readonly userRepository: UserRepository
    ) {}

    async apply(input: ApplyForBlockerInput) {
        const user = await this.userRepository.findById(input.userId);

        if(!user) {
            throw new Error('User not found');
        }

        if(user.status !== 'ACTIVE') {
            throw new Error('User account is not active');
        }

        if(!user.phone_verified_at) {
            throw new Error('Phone number must be verified');
        }

        if(user.role !== 'USER') {
            throw new Error('Only users can apply to become blockers');
        }

        const existingProfile = await this.blockerRepository.findByUserId(input.userId);
        
        if(existingProfile) {
            throw new Error('Blocker profile already exists for this user');
        }

        return this.blockerRepository.create(input);
    }

    async getApplicationById(id: string) {
        const application = await this.blockerRepository.findById(id);

        if(!application) {
            throw new Error('Blocker application not found');
        }

        return application;
    }

    async getPendingApplications() {
        return this.blockerRepository.findPending();
    }
}
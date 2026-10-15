import { BlockerRepository } from './../repositories/blocker.repository';
import { UserRepository } from '../repositories/user.repository';
import { ApplyForBlockerInput, RejectBlockerInput } from '../validators/blocker.validator';
import crypto from 'node:crypto';
import { db } from '../config/database';


export class BlockerService {
    constructor(
        private readonly blockerRepository: BlockerRepository,
        private readonly userRepository: UserRepository
    ) {}

    async apply(userId: string,input: ApplyForBlockerInput) {
        const user = await this.userRepository.findById(userId);

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

        const existingProfile = await this.blockerRepository.findByUserId(userId);
        
        if(existingProfile) {
            throw new Error('Blocker profile already exists for this user');
        }

        return this.blockerRepository.create({
            userId,
            nationalId: input.nationalId,
            operatingLocationId: input.operatingLocationId,
            agreementDocumentPath: input.agreementDocumentPath,
        });
    }

    async getApplicationById(id: string) {
        const application = await this.blockerRepository.findById(id);

        if(!application) {
            throw new Error('Blocker application not found');
        }

        return application;
    }

    async getApplicationByUserId(userId: string) {
        const application = await this.blockerRepository.findByUserId(userId);

        if(!application) {
            throw new Error('No blocker application found for this user');
        }

        return application;
    }

    async getPendingApplications() {
        return this.blockerRepository.findPending();
    }

    async reject(
        blockerId: string,
        adminId: string,
        rejectionReason: string,
    ){
        const application = await this.blockerRepository.findById(blockerId);

        if(!application) {
            throw new Error("Blocker application not found");
        }

        if(application.status !== "PENDING") {
            throw new Error("Only pending applications can be rejected");
        }

        return this.blockerRepository.reject(
            blockerId,
            adminId,
            rejectionReason
        )
    }

    async approve(
        blockerId: string,
        adminId: string
    ) {
        const application = await this.blockerRepository.findById(blockerId);

        if(!application) {
            throw new Error("Blocker application not found");
        }

        if(application.status !== "PENDING") {
            throw new Error("Only pending applications can be rejected");
        }

        const blockerRoleId = await this.userRepository.findRoleByName('BLOCKER');

        if (!blockerRoleId) {
            throw new Error('BLOCKER role is not configured in the roles table');
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            const updatedProfile = await this.blockerRepository.approve(
                blockerId,
                adminId,
                client
            );

            if(!updatedProfile) {
                throw new Error('Application is longer pending');
            }

            await this.userRepository.updateRole(
                updatedProfile.user_id,
                blockerRoleId,
                client
            );

            await client.query('COMMIT');
            return updatedProfile;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
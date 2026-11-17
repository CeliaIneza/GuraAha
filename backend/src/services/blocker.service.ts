import { EmailService } from './email.service';
import { BlockerRepository } from '../repositories/blocker.repository';
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


        if(user.role !== 'USER') {
            throw new Error('Only users can apply to become blockers');
        }

        const existingProfile = await this.blockerRepository.findByUserId(userId);
        
        if(existingProfile && existingProfile.status === 'APPROVED') {
            throw new Error('Your Blocker account is already approved');
        }

        let application;
        try {
            application = await this.blockerRepository.create({
                userId,
                nationalId: input.nationalId,
                operatingLocationId: input.operatingLocationId,
                agreementDocumentPath: input.agreementDocumentPath,
            });
        } catch (dbErr: any) {
            if (dbErr?.code === '23505' && String(dbErr?.constraint || '').includes('national_id')) {
                throw new Error('This National ID is already registered with another blocker application');
            }
            throw dbErr;
        }

        // Send confirmation email to applicant asynchronously so apply responds immediately
        if (user.email) {
            const emailService = new EmailService();
            emailService
                .sendBlockerApplicationEmail(user.email, `${user.first_name} ${user.last_name}`)
                .catch((emailErr) => {
                    console.error('Failed to send blocker application email:', emailErr);
                });
        }

        return application;
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

        const userRoleId = await this.userRepository.findRoleByName('USER');
        const client = await db.connect();

        try {
            await client.query('BEGIN');

            const updatedProfile = await this.blockerRepository.reject(
                blockerId,
                adminId,
                rejectionReason,
                client
            );

            // If this blocker was previously APPROVED, downgrade role back to USER and unpublish their listings
            const userInfo = await this.userRepository.findById(application.user_id, client);
            if (userInfo && userInfo.role === 'BLOCKER' && userRoleId) {
                await this.userRepository.updateRole(application.user_id, userRoleId, client);
            }

            await client.query(
                `UPDATE listings SET is_disabled = TRUE, updated_at = NOW() WHERE blocker_id = $1`,
                [blockerId]
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

    async approve(
        blockerId: string,
        adminId: string
    ) {
        const application = await this.blockerRepository.findById(blockerId);

        if(!application) {
            throw new Error("Blocker application not found");
        }

        if(application.status === "APPROVED") {
            return application;
        }

        const blockerRoleId = await this.userRepository.findRoleByName('BLOCKER');

        if (!blockerRoleId) {
            throw new Error('BLOCKER role is not configured in the roles table');
        }

        const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const client = await db.connect();

        try {
            await client.query('BEGIN');

            const updatedProfile = await this.blockerRepository.approve(
                blockerId,
                adminId,
                verificationCode,
                client
            );

            if(!updatedProfile) {
                throw new Error('Failed to approve blocker application');
            }

            await this.userRepository.updateRole(
                updatedProfile.user_id,
                blockerRoleId,
                client
            );

            await client.query('COMMIT');

            // Send approval email
            try {
                const userInfo = await this.userRepository.findById(updatedProfile.user_id);
                if (userInfo && userInfo.email) {
                    const emailService = new EmailService();
                    await emailService.sendBlockerApprovalEmail(
                        userInfo.email,
                        `${userInfo.first_name} ${userInfo.last_name}`,
                        updatedProfile.verification_code || verificationCode
                    );
                }
            } catch (emailErr) {
                console.error('Failed to send blocker approval email:', emailErr);
            }

            return updatedProfile;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async revise(
        blockerId: string,
        adminId: string,
        adminNote: string
    ) {
        const application = await this.blockerRepository.findById(blockerId);
        if (!application) {
            throw new Error('Blocker application not found');
        }
        return this.blockerRepository.revise(
            blockerId,
            adminId,
            adminNote || 'Revision requested by admin'
        );
    }

    async delete(blockerId: string) {
        const application = await this.blockerRepository.findById(blockerId);
        if (!application) {
            throw new Error('Blocker application not found');
        }

        const userRoleId = await this.userRepository.findRoleByName('USER');
        const client = await db.connect();

        try {
            await client.query('BEGIN');

            const userInfo = await this.userRepository.findById(application.user_id, client);
            if (userInfo && userInfo.role === 'BLOCKER' && userRoleId) {
                await this.userRepository.updateRole(application.user_id, userRoleId, client);
            }

            // Clean up dependent records on listings owned by this blocker
            await client.query(
                `DELETE FROM lotto_entries WHERE contact_unlock_id IN (
                    SELECT id FROM contact_unlocks WHERE listing_id IN (
                        SELECT id FROM listings WHERE blocker_id = $1
                    )
                )`,
                [blockerId]
            );
            await client.query(
                `DELETE FROM contact_unlocks WHERE listing_id IN (
                    SELECT id FROM listings WHERE blocker_id = $1
                )`,
                [blockerId]
            );
            await client.query(
                `DELETE FROM listing_photos WHERE listing_id IN (
                    SELECT id FROM listings WHERE blocker_id = $1
                )`,
                [blockerId]
            );
            await client.query(`DELETE FROM listings WHERE blocker_id = $1`, [blockerId]);
            await client.query(`DELETE FROM subscriptions WHERE blocker_id = $1`, [blockerId]);

            const deleted = await this.blockerRepository.deleteById(blockerId, client);
            await client.query('COMMIT');
            return deleted;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
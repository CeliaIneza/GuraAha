import bcrypt from 'bcrypt';
import { EmailService } from './email.service';
import { BlockerRepository } from '../repositories/blocker.repository';
import { UserRepository } from '../repositories/user.repository';
import { ApplyForBlockerInput } from '../validators/blocker.validator';
import { db } from '../config/database';

const PASSWORD_SALT_ROUNDS = 12;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PW_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateBlockerCode(): string {
    return Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
}

export function generateTempPassword(): string {
    return Array.from({ length: 10 }, () => PW_ALPHABET[Math.floor(Math.random() * PW_ALPHABET.length)]).join('');
}

function generateUsernameFromName(fullName: string): string {
    const parts = fullName
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length > 1 && parts[1]) {
        return `${parts[0]}.${parts[1][0]}`;
    }
    return parts[0] || `blocker.${Math.floor(100 + Math.random() * 900)}`;
}

export class BlockerService {
    constructor(
        private readonly blockerRepository: BlockerRepository,
        private readonly userRepository: UserRepository
    ) {}

    private async ensureUniqueUsername(base: string, excludeUserId?: string): Promise<string> {
        let candidate = base.toLowerCase().replace(/[^a-z0-9._-]/g, '');
        if (candidate.length < 3) candidate = `${candidate}123`;
        let counter = 2;
        while (true) {
            const existing = await this.userRepository.findByUsername(candidate);
            if (!existing || (excludeUserId && existing.id === excludeUserId)) {
                return candidate;
            }
            candidate = `${base}${counter++}`;
        }
    }

    async apply(userId: string | undefined, input: ApplyForBlockerInput) {
        let targetUserId = userId;
        let user = targetUserId ? await this.userRepository.findById(targetUserId) : null;

        // Public application without prior login (matches prototype Become a Blocker flow)
        if (!user) {
            if (!input.fullName || !input.phone) {
                throw new Error('Please enter your full name and MoMo phone number.');
            }
            const rawUsername = (input.username || generateUsernameFromName(input.fullName)).trim().toLowerCase();
            if (!/^[a-z0-9._-]{3,30}$/.test(rawUsername)) {
                throw new Error('Username: 3–30 characters, lowercase letters, numbers, dot, dash or underscore.');
            }
            const existingUsername = await this.userRepository.findByUsername(rawUsername);
            if (existingUsername) {
                throw new Error('That username is already taken. Please choose another one.');
            }

            const pw = input.password || generateTempPassword();
            if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
                throw new Error('Password: at least 8 characters, with a letter and a number.');
            }

            // Check if phone or email already exists
            let existingUser = await this.userRepository.findByPhone(input.phone.trim());
            if (!existingUser && input.email) {
                existingUser = await this.userRepository.findByEmail(input.email.trim());
            }

            const nameParts = input.fullName.trim().split(/\s+/);
            const firstName = nameParts[0] || 'Blocker';
            const lastName = nameParts.slice(1).join(' ') || '';
            const passwordHash = await bcrypt.hash(pw, PASSWORD_SALT_ROUNDS);

            if (existingUser) {
                await this.userRepository.updateProfile(existingUser.id, {
                    firstName,
                    lastName,
                    phone: input.phone.trim(),
                    email: input.email || existingUser.email,
                    username: rawUsername,
                });
                await this.userRepository.updatePassword(existingUser.id, passwordHash, false);
                user = await this.userRepository.findById(existingUser.id);
                targetUserId = existingUser.id;
            } else {
                const userRoleId = await this.userRepository.findRoleByName('USER');
                if (!userRoleId) {
                    throw new Error('USER role is not configured in the roles table');
                }
                const created = await this.userRepository.create({
                    roleId: userRoleId,
                    phone: input.phone.trim(),
                    email: input.email ? input.email.trim().toLowerCase() : undefined,
                    username: rawUsername,
                    passwordHash,
                    firstName,
                    lastName,
                    mustChangePassword: false,
                });
                user = await this.userRepository.findById(created.id);
                targetUserId = created.id;
            }
        } else {
            // Logged-in user applying: update their username / password / name / phone if provided
            const updates: Record<string, any> = {};
            if (input.fullName) {
                const parts = input.fullName.trim().split(/\s+/);
                updates.firstName = parts[0] || user.first_name;
                updates.lastName = parts.slice(1).join(' ') || user.last_name;
            }
            if (input.phone) updates.phone = input.phone.trim();
            if (input.email) updates.email = input.email.trim().toLowerCase();
            if (input.username) {
                const rawUsername = input.username.trim().toLowerCase();
                if (!/^[a-z0-9._-]{3,30}$/.test(rawUsername)) {
                    throw new Error('Username: 3–30 characters, lowercase letters, numbers, dot, dash or underscore.');
                }
                updates.username = rawUsername;
            }
            if (Object.keys(updates).length > 0) {
                user = await this.userRepository.updateProfile(user.id, updates);
            }
            if (input.password) {
                if (input.password.length < 8 || !/[a-zA-Z]/.test(input.password) || !/[0-9]/.test(input.password)) {
                    throw new Error('Password: at least 8 characters, with a letter and a number.');
                }
                const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
                await this.userRepository.updatePassword(user.id, passwordHash, false);
            }
        }

        if (!targetUserId || !user) {
            throw new Error('User not found');
        }

        const existingProfile = await this.blockerRepository.findByUserId(targetUserId);
        if (existingProfile && existingProfile.status === 'APPROVED') {
            throw new Error('Your Blocker account is already approved');
        }

        let application;
        try {
            application = await this.blockerRepository.create({
                userId: targetUserId,
                nationalId: input.nationalId.trim(),
                operatingLocationId: input.operatingLocationId,
                areaText: input.areaText,
                agreementDocumentPath: input.agreementDocumentPath,
            });
        } catch (dbErr: any) {
            if (dbErr?.code === '23505' && String(dbErr?.constraint || '').includes('national_id')) {
                throw new Error('This National ID is already registered with another blocker application');
            }
            throw dbErr;
        }

        const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                targetUserId,
                `📝 New blocker application from ${displayName} (${input.areaText || 'Rwanda'})`,
            ])
            .catch(() => {});

        if (user.email) {
            const emailService = new EmailService();
            emailService
                .sendBlockerApplicationEmail(user.email, displayName)
                .catch((emailErr) => {
                    console.error('Failed to send blocker application email:', emailErr);
                });
        }

        return application;
    }

    async getApplicationById(id: string) {
        const application = await this.blockerRepository.findById(id);
        if (!application) {
            throw new Error('Blocker application not found');
        }
        return application;
    }

    async getApplicationByUserId(userId: string) {
        const application = await this.blockerRepository.findByUserId(userId);
        if (!application) {
            throw new Error('No blocker application found for this user');
        }
        return application;
    }

    async getPendingApplications() {
        return this.blockerRepository.findPending();
    }

    async reject(blockerId: string, adminId: string, rejectionReason: string) {
        const application = await this.blockerRepository.findById(blockerId);
        if (!application) {
            throw new Error('Blocker application not found');
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

            const userInfo = await this.userRepository.findById(application.user_id, client);
            if (userInfo && userInfo.role === 'BLOCKER' && userRoleId) {
                await this.userRepository.updateRole(application.user_id, userRoleId, client);
            }

            await client.query('COMMIT');

            const name = userInfo ? `${userInfo.first_name} ${userInfo.last_name}`.trim() : blockerId;
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    adminId,
                    `❌ Blocker ${name} rejected: ${rejectionReason}`,
                ])
                .catch(() => {});

            return updatedProfile;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async approve(blockerId: string, adminId: string) {
        const application = await this.blockerRepository.findById(blockerId);
        if (!application) {
            throw new Error('Blocker application not found');
        }

        const blockerRoleId = await this.userRepository.findRoleByName('BLOCKER');
        if (!blockerRoleId) {
            throw new Error('BLOCKER role is not configured in the roles table');
        }

        const verificationCode = application.verification_code || generateBlockerCode();
        const userInfo = await this.userRepository.findById(application.user_id);
        let assignedUsername = userInfo?.username;
        if (!assignedUsername && userInfo) {
            assignedUsername = await this.ensureUniqueUsername(
                generateUsernameFromName(`${userInfo.first_name} ${userInfo.last_name}`),
                userInfo.id
            );
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const updatedProfile = await this.blockerRepository.approve(
                blockerId,
                adminId,
                verificationCode,
                client
            );

            if (!updatedProfile) {
                throw new Error('Failed to approve blocker application');
            }

            await this.userRepository.updateRole(updatedProfile.user_id, blockerRoleId, client);
            if (assignedUsername && !userInfo?.username) {
                await client.query(`UPDATE users SET username = $1 WHERE id = $2`, [
                    assignedUsername,
                    updatedProfile.user_id,
                ]);
            }

            await client.query('COMMIT');

            const fullName = userInfo ? `${userInfo.first_name} ${userInfo.last_name}`.trim() : 'Blocker';
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    adminId,
                    `✅ Blocker ${fullName} approved code ${updatedProfile.verification_code || verificationCode} and login @${assignedUsername || ''}`,
                ])
                .catch(() => {});

            if (userInfo && userInfo.email) {
                const emailService = new EmailService();
                emailService
                    .sendBlockerApprovalEmail(
                        userInfo.email,
                        fullName,
                        updatedProfile.verification_code || verificationCode,
                        assignedUsername
                    )
                    .catch((emailErr) => console.error('Failed to send blocker approval email:', emailErr));
            }

            return {
                ...updatedProfile,
                username: assignedUsername,
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async toggleSuspend(blockerId: string, adminId: string) {
        const application = await this.blockerRepository.findById(blockerId);
        if (!application) {
            throw new Error('Blocker application not found');
        }

        const nextStatus = application.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
        const updated = await this.blockerRepository.setStatus(blockerId, nextStatus, adminId);
        const userInfo = await this.userRepository.findById(application.user_id);
        const fullName = userInfo ? `${userInfo.first_name} ${userInfo.last_name}`.trim() : 'Blocker';
        const listingCount = await this.blockerRepository.countListingsByBlockerId(blockerId);

        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                adminId,
                nextStatus === 'SUSPENDED'
                    ? `⏸ Blocker ${fullName} suspended ${listingCount} listing(s) hidden`
                    : `▶ Blocker ${fullName} reactivated listings live again`,
            ])
            .catch(() => {});

        return { ...updated, listingCount };
    }

    async resetPassword(blockerId: string, adminId: string, customPassword?: string) {
        const application = await this.blockerRepository.findById(blockerId);
        if (!application) {
            throw new Error('Blocker application not found');
        }
        const userInfo = await this.userRepository.findById(application.user_id);
        if (!userInfo) {
            throw new Error('Blocker user account not found');
        }

        const tempPassword = customPassword && customPassword.length >= 8 ? customPassword : generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, PASSWORD_SALT_ROUNDS);
        await this.userRepository.updatePassword(userInfo.id, passwordHash, true);

        let username = userInfo.username;
        if (!username) {
            username = await this.ensureUniqueUsername(
                generateUsernameFromName(`${userInfo.first_name} ${userInfo.last_name}`),
                userInfo.id
            );
            await this.userRepository.updateProfile(userInfo.id, { username });
        }

        const fullName = `${userInfo.first_name} ${userInfo.last_name}`.trim();
        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                adminId,
                `🔑 Password reset for ${fullName} (@${username}) temporary password issued`,
            ])
            .catch(() => {});

        if (userInfo.email) {
            const emailService = new EmailService();
            emailService
                .sendAlertEmail(
                    userInfo.email,
                    'Guraaha – Your Temporary Blocker Password',
                    'Your Blocker Password Was Reset',
                    `Hello ${fullName}, your Guraaha blocker login (@${username}) has been assigned a new temporary password: ${tempPassword}. You will be asked to set your own password when you log in.`
                )
                .catch(() => {});
        }

        return {
            blockerId,
            username,
            temporaryPassword: tempPassword,
            phone: userInfo.phone,
            email: userInfo.email,
            name: fullName,
        };
    }

    async adminSaveBlocker(
        adminId: string,
        input: {
            id?: string;
            name: string;
            phone: string;
            email?: string;
            nid: string;
            area?: string;
            operatingLocationId?: string;
            username: string;
            password?: string;
            mustChange?: boolean;
            status?: string;
            plan?: string;
        }
    ) {
        const cleanUsername = (input.username || '').trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
            throw new Error('Username: 3–30 characters, lowercase letters, numbers, dot, dash or underscore.');
        }

        const nameParts = (input.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Blocker';
        const lastName = nameParts.slice(1).join(' ') || '';
        const targetStatus = (input.status || 'APPROVED').toUpperCase();
        const roleName = targetStatus === 'APPROVED' ? 'BLOCKER' : 'USER';
        const roleId = await this.userRepository.findRoleByName(roleName);
        if (!roleId) throw new Error(`Role ${roleName} not found`);

        if (input.id) {
            // Edit existing blocker
            const existingProfile = await this.blockerRepository.findById(input.id);
            if (!existingProfile) throw new Error('Blocker not found');

            await this.userRepository.updateProfile(existingProfile.user_id, {
                firstName,
                lastName,
                phone: input.phone.trim(),
                email: input.email || undefined,
                username: cleanUsername,
                areaText: input.area,
            });
            await this.userRepository.updateRole(existingProfile.user_id, roleId);

            if (input.password && input.password.length >= 8) {
                const hash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
                await this.userRepository.updatePassword(
                    existingProfile.user_id,
                    hash,
                    input.mustChange ?? true
                );
            } else if (input.mustChange !== undefined) {
                await db.query(`UPDATE users SET must_change_password = $1 WHERE id = $2`, [
                    Boolean(input.mustChange),
                    existingProfile.user_id,
                ]);
            }

            const code =
                targetStatus === 'APPROVED'
                    ? existingProfile.verification_code || generateBlockerCode()
                    : existingProfile.verification_code;

            await db.query(
                `
                UPDATE blocker_profiles
                SET
                    national_id = $1,
                    area_text = COALESCE($2, area_text),
                    status = $3,
                    verification_code = $4,
                    updated_at = NOW()
                WHERE id = $5
                `,
                [input.nid.trim(), input.area || null, targetStatus, code, existingProfile.id]
            );

            await this.syncBlockerAdminPlan(existingProfile.id, existingProfile.user_id, input.plan);

            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    adminId,
                    `💾 Blocker ${input.name} updated`,
                ])
                .catch(() => {});

            return this.blockerRepository.findById(existingProfile.id);
        } else {
            // Create new blocker
            const existingUsername = await this.userRepository.findByUsername(cleanUsername);
            if (existingUsername) {
                throw new Error('That username is already taken.');
            }
            const rawPw = input.password && input.password.length >= 8 ? input.password : generateTempPassword();
            const hash = await bcrypt.hash(rawPw, PASSWORD_SALT_ROUNDS);

            const createdUser = await this.userRepository.create({
                roleId,
                phone: input.phone.trim(),
                email: input.email ? input.email.trim().toLowerCase() : undefined,
                username: cleanUsername,
                passwordHash: hash,
                firstName,
                lastName,
                mustChangePassword: input.mustChange ?? true,
            });

            const code = targetStatus === 'APPROVED' ? generateBlockerCode() : null;
            const createdProfile = await this.blockerRepository.create({
                userId: createdUser.id,
                nationalId: input.nid.trim(),
                operatingLocationId: input.operatingLocationId || null,
                areaText: input.area || null,
                status: targetStatus,
                verificationCode: code,
            });

            await this.syncBlockerAdminPlan(createdProfile.id, createdUser.id, input.plan);

            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    adminId,
                    `➕ Blocker ${input.name} added${code ? ' code ' + code : ''}`,
                ])
                .catch(() => {});

            return { ...createdProfile, username: cleanUsername, temporaryPassword: rawPw };
        }
    }

    private async syncBlockerAdminPlan(blockerId: string, userId: string, planLabel?: string) {
        if (planLabel === undefined) return;
        await db.query(
            `UPDATE subscriptions SET status = 'CANCELLED', updated_at = NOW() WHERE blocker_id = $1 AND status = 'ACTIVE'`,
            [blockerId]
        );
        if (!planLabel) return;
        const isWeekly = planLabel.toLowerCase().includes('week');
        const period = isWeekly ? 'WEEK' : 'MONTH';
        const plan = isWeekly ? 'BLOCKER_PRO_WEEKLY' : 'BLOCKER_PRO_MONTHLY';
        const days = isWeekly ? 7 : 30;
        await db.query(
            `
            INSERT INTO subscriptions (blocker_id, user_id, subscription_type, period, plan, starts_at, expires_at, status)
            VALUES ($1, $2, 'BLOCKER_PRO', $3, $4, NOW(), NOW() + ($5::int * INTERVAL '1 day'), 'ACTIVE')
            `,
            [blockerId, userId, period, plan, days]
        );
    }

    async revise(blockerId: string, adminId: string, adminNote: string) {
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

        const listingCount = await this.blockerRepository.countListingsByBlockerId(blockerId);
        if (listingCount > 0) {
            throw new Error(
                `This blocker still has ${listingCount} listing(s). Suspend them instead, or delete/reassign their listings first.`
            );
        }

        const userRoleId = await this.userRepository.findRoleByName('USER');
        const client = await db.connect();

        try {
            await client.query('BEGIN');

            const userInfo = await this.userRepository.findById(application.user_id, client);
            if (userInfo && userInfo.role === 'BLOCKER' && userRoleId) {
                await this.userRepository.updateRole(application.user_id, userRoleId, client);
            }

            await client.query(`DELETE FROM subscriptions WHERE blocker_id = $1`, [blockerId]);
            const deleted = await this.blockerRepository.deleteById(blockerId, client);
            await client.query('COMMIT');

            const fullName = userInfo ? `${userInfo.first_name} ${userInfo.last_name}`.trim() : blockerId;
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    null,
                    `🗑 Blocker ${fullName} deleted`,
                ])
                .catch(() => {});

            return deleted;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
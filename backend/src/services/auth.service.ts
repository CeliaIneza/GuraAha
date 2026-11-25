import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { toAuthUserView } from '../utils/jwt.util';
import { db } from '../config/database';

const PASSWORD_SALT_ROUNDS = 12;

export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly tokenService: TokenService
    ) {}

    async register(input: RegisterInput) {
        const existingByPhone = await this.userRepository.findByPhone(input.phone);
        if(existingByPhone) {
            throw new Error('Phone number is already registered');
        }

        const cleanEmail = input.email ? input.email.trim().toLowerCase() : undefined;
        if(cleanEmail) {
            const existingByEmail = await this.userRepository.findByEmail(cleanEmail);
            if(existingByEmail) {
                throw new Error('Email is already registered');
            }
        }

        const cleanUsername = input.username ? input.username.trim().toLowerCase() : undefined;
        if (cleanUsername) {
            const existingByUsername = await this.userRepository.findByUsername(cleanUsername);
            if (existingByUsername) {
                throw new Error('Username is already taken');
            }
        }

        const userRoleId = await this.userRepository.findRoleByName('USER');
        if(!userRoleId) {
            throw new Error('USER role is not configured in the roles table');
        }

        const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

        const created = await this.userRepository.create({
            roleId: userRoleId,
            phone: input.phone.trim(),
            email: cleanEmail,
            username: cleanUsername,
            passwordHash,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
        });

        const user = await this.userRepository.findById(created.id);
        const tokens = await this.tokenService.issuePair(user.id, 'USER');
        return { ...tokens, user: toAuthUserView(user, 'USER') };
    }

    async login(input: LoginInput) {
        const identifier = (
            input.identifier ||
            input.username ||
            input.email ||
            input.phone ||
            ''
        ).trim();

        const user = await this.userRepository.findByIdentifier(identifier);

        if (!user || !user.password_hash) {
            throw new Error('Wrong username, email, phone, or password.');
        }

        const passwordMatches = await bcrypt.compare(input.password, user.password_hash);
        if (!passwordMatches) {
            throw new Error('Wrong username, email, phone, or password.');
        }

        if (user.status !== 'ACTIVE') {
            throw new Error('Your account is suspended. Please contact Guraaha support.');
        }

        // Prototype blocker status checks when logging in with a blocker username or blocker account
        if (user.blocker_status === 'SUSPENDED') {
            throw new Error('Your account is suspended. Please contact Guraaha support.');
        }

        const loggedInViaUsername =
            user.username && identifier.toLowerCase() === String(user.username).toLowerCase();

        if (loggedInViaUsername && user.role !== 'ADMIN') {
            if (user.blocker_status === 'PENDING') {
                throw new Error(
                    'Your application is still being reviewed. You will be notified when it is approved.'
                );
            }
            if (user.blocker_status === 'REJECTED') {
                throw new Error(
                    `Your application was not approved: ${
                        user.blocker_rejection_reason || 'please contact Guraaha support'
                    }.`
                );
            }
        }

        await this.userRepository.updateLastLogin(user.id).catch(() => {});

        if (user.role === 'BLOCKER' || user.role === 'ADMIN') {
            await db
                .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                    user.id,
                    `🔑 ${user.role === 'ADMIN' ? 'Admin' : 'Blocker'} ${user.first_name} ${user.last_name} logged in`,
                ])
                .catch(() => {});
        }

        const tokens = await this.tokenService.issuePair(user.id, user.role);
        return { ...tokens, user: toAuthUserView(user, user.role) };
    }

    async getMe(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return toAuthUserView(user, user.role);
    }

    async updateProfile(
        userId: string,
        input: {
            fullName?: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
            email?: string;
            username?: string;
            areaText?: string;
        }
    ) {
        let firstName = input.firstName;
        let lastName = input.lastName;
        if (input.fullName && !firstName) {
            const parts = input.fullName.trim().split(/\s+/);
            firstName = parts[0] || 'User';
            lastName = parts.slice(1).join(' ') || '';
        }

        const updated = await this.userRepository.updateProfile(userId, {
            firstName,
            lastName,
            phone: input.phone?.trim(),
            email: input.email,
            username: input.username,
            areaText: input.areaText,
        });

        if (!updated) {
            throw new Error('User not found');
        }

        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                userId,
                `👤 ${updated.first_name} ${updated.last_name} updated their profile`,
            ])
            .catch(() => {});

        return toAuthUserView(updated, updated.role);
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.password_hash) {
            throw new Error('User not found');
        }

        const matches = await bcrypt.compare(currentPassword, user.password_hash);
        if (!matches) {
            throw new Error('Current password is not correct.');
        }

        if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            throw new Error('New password: at least 8 characters, with a letter and a number.');
        }

        if (currentPassword === newPassword) {
            throw new Error('The new password must be different from the current one.');
        }

        const hash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
        await this.userRepository.updatePassword(userId, hash, false);

        await db
            .query(`INSERT INTO audit_logs (actor_id, action) VALUES ($1, $2)`, [
                userId,
                `🔒 ${user.first_name} ${user.last_name} changed their password`,
            ])
            .catch(() => {});

        const refreshed = await this.userRepository.findById(userId);
        return toAuthUserView(refreshed, refreshed.role);
    }
}
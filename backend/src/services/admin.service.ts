import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { CreateAdminInput } from '../validators/auth.validator';
import { toAuthUserView } from '../utils/jwt.util';
import { env } from '../config/env';

const PASSWORD_SALT_ROUNDS = 12;

export class AdminService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly tokenService: TokenService
    ) {}

    async createAdmin(input: CreateAdminInput, providedSecret: string | undefined) {
        if (!env.ADMIN_SETUP_SECRET) {
            throw new Error('Admin creation is not configured (ADMIN_SETUP_SECRET missing)');
        }

        const existingByPhone = await this.userRepository.findByPhone(input.phone);
        if(existingByPhone) {
            throw new Error('Phone number is already registered');
        }

        if (input.email) {
            const existingByEmail = await this.userRepository.findByEmail(input.email);

            if (existingByEmail) {
                throw new Error('Email is already registered');
            }
        }

        const adminRoleId = await this.userRepository.findRoleByName('ADMIN');
        if(!adminRoleId) {
            throw new Error('ADMIN role is not configured in the roles table');
        }

        const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

        const user = await this.userRepository.create({
            roleId: adminRoleId,
            phone: input.phone,
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
        });

        const tokens = await this.tokenService.issuePair(user.id, 'ADMIN');
        return { ...tokens, user: toAuthUserView(user, 'ADMIN') };
    }
}
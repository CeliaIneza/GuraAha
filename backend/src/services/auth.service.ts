import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { toAuthUserView } from '../utils/jwt.util';

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

        if(input.email) {
            const existingByEmail = await this.userRepository.findByEmail(input.email);

            if(existingByEmail) {
                throw new Error('Email is already registered');
            }
        }

        const userRoleId = await this.userRepository.findRoleByName('USER');
        if(!userRoleId) {
            throw new Error('USER role is not configured in the roles table');
        }

        const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

        const user = await this.userRepository.create({
            roleId: userRoleId,
            phone: input.phone,
            email: input.email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName
        });

        const tokens = await this.tokenService.issuePair(user.id, 'USER');
        return { ...tokens, user: toAuthUserView(user, 'USER') };
    }

    async login(input: LoginInput) {
        const user = input.phone ? await this.userRepository.findByPhone(input.phone) : await this.userRepository.findByEmail(input.email as string);

        if (!user || !user.password_hash) {
            throw new Error('Invalid credentials');
        }

        if (user.status !== 'ACTIVE') {
            throw new Error('User account is not active');
        }

        const passwordMatches = await bcrypt.compare(input.password, user.password_hash);
        if (!passwordMatches) {
            throw new Error('Invalid credentials');
        }

        const tokens = await this.tokenService.issuePair(user.id, user.role);
        return { ... tokens, user: toAuthUserView(user, user.role) };
    }
}
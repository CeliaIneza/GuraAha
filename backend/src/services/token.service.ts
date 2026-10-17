import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { signAuthToken, toAuthUserView } from "../utils/jwt.util";
import { generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from "../utils/refreshtoken.util";
import { hash } from "node:crypto";

export class TokenService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository
    ) {}

    async issuePair(userId: string, role: string) {
        const accessToken = signAuthToken(userId, role);
        const refreshToken = generateRefreshToken();
        const tokenHash = hashRefreshToken(refreshToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

        await this.refreshTokenRepository.create({
            userId,
            tokenHash,
            expiresAt
        });

        return { accessToken, refreshToken };
    }

    async refresh(refreshToken: string) {
        const tokenHash = hashRefreshToken(refreshToken);
        const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);

        if(!stored) {
            throw new Error('Invalid or expired refresh token');
        }

        const user = await this.userRepository.findById(stored.user_id);

        if (!user || user.status !== 'ACTIVE') {
            await this.refreshTokenRepository.revoke(stored.id);
            throw new Error('Account is no longer active');
        }

        await this.refreshTokenRepository.revoke(stored.id);
        const tokens = await this.issuePair(user.id, user.role);

        return {...tokens, user: toAuthUserView(user, user.role)};
    }

    async logout(refreshToken: string) {
        const tokenHash = hashRefreshToken(refreshToken);
        const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
        if(stored) {
            await this.refreshTokenRepository.revoke(stored.id);
        }
    }
}
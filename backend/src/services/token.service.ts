import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshtoken.repository";
import { RevokedTokenRepository } from "../repositories/revoked-token.repository";
import { signAuthToken, toAuthUserView } from "../utils/jwt.util";
import { generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from "../utils/refreshtoken.util";

export interface LogoutOptions {
    refreshToken?: string;
    accessTokenJti?: string;
    accessTokenExp?: number;
    userId?: string;
}

export class TokenService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly revokedTokenRepository: RevokedTokenRepository = new RevokedTokenRepository()
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

    async logout(options: LogoutOptions | string) {
        // Support backwards compatibility if string refreshToken passed
        if (typeof options === 'string') {
            const tokenHash = hashRefreshToken(options);
            const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
            if(stored) {
                await this.refreshTokenRepository.revoke(stored.id);
            }
            return;
        }

        if (options.refreshToken) {
            const tokenHash = hashRefreshToken(options.refreshToken);
            const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
            if(stored) {
                await this.refreshTokenRepository.revoke(stored.id);
            }
        }

        if (options.accessTokenJti) {
            const expiresAt = options.accessTokenExp 
                ? new Date(options.accessTokenExp * 1000) 
                : new Date(Date.now() + 15 * 60 * 1000);

            await this.revokedTokenRepository.revoke({
                jti: options.accessTokenJti,
                userId: options.userId,
                expiresAt,
            });
        }
    }

    async logoutAll(userId: string, currentAccessTokenJti?: string, currentAccessTokenExp?: number) {
        // 1. Revoke all active refresh tokens in database
        await this.refreshTokenRepository.revokeAllForUser(userId);

        // 2. Blacklist current access token
        if (currentAccessTokenJti) {
            const expiresAt = currentAccessTokenExp 
                ? new Date(currentAccessTokenExp * 1000) 
                : new Date(Date.now() + 15 * 60 * 1000);

            await this.revokedTokenRepository.revoke({
                jti: currentAccessTokenJti,
                userId,
                expiresAt,
            });
        }
    }
}
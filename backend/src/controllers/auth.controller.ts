import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";
import { VerificationService } from "../services/verification.service";
import { decodeAuthToken } from "../utils/jwt.util";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService = new VerificationService(),
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);

      if (result?.user?.id) {
        this.verificationService.sendVerificationCode(result.user.id).catch((err) => {
          console.error("Auto-verification code dispatch failed:", err);
        });
      }

      return res.status(201).json({
        message: "Registered successfully. Verification code dispatched.",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Registration failed",
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json({
        message: "Logged in successfully",
        data: result,
      });
    } catch (error) {
      return res.status(401).json({
        message: error instanceof Error ? error.message : "Login failed",
      });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const result = await this.tokenService.refresh(req.body.refreshToken);

      return res.status(200).json({
        message: "Token refreshed",
        data: result,
      });
    } catch (error) {
      return res.status(401).json({
        message:
          error instanceof Error ? error.message : "Failed to refresh token",
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body?.refreshToken;

      let accessTokenJti: string | undefined = req.user?.jti;
      let accessTokenExp: number | undefined = req.user?.exp;
      let userId: string | undefined = req.user?.id;

      if (!accessTokenJti) {
        const header = req.headers.authorization;
        if (header && header.startsWith("Bearer ")) {
          const rawToken = header.slice("Bearer ".length).trim();
          const decoded = decodeAuthToken(rawToken);
          if (decoded) {
            accessTokenJti = decoded.jti;
            accessTokenExp = decoded.exp;
            userId = decoded.sub;
          }
        }
      }

      await this.tokenService.logout({
        refreshToken,
        accessTokenJti,
        accessTokenExp,
        userId,
      });

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to logout",
      });
    }
  };

  logoutAll = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      await this.tokenService.logoutAll(userId, req.user?.jti, req.user?.exp);

      return res.status(200).json({ message: "Logged out from all sessions successfully" });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to logout all sessions",
      });
    }
  };

  sendVerification = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const result = await this.verificationService.sendVerificationCode(userId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to send verification code",
      });
    }
  };

  verifyAccount = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { code } = req.body;
      const result = await this.verificationService.verifyCode(userId, code);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Verification failed",
      });
    }
  };
}

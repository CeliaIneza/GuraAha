import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";
import { VerificationService } from "../services/verification.service";

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
      if (req.body.refreshToken) {
        await this.tokenService.logout(req.body.refreshToken);
      }
      return res.status(200).json({ message: "Logged out" });
    } catch (error) {
      return res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to logout",
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

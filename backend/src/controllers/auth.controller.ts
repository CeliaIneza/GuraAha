import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomUUID, createHash } from "crypto";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";
import { VerificationService } from "../services/verification.service";
import { decodeAuthToken } from "../utils/jwt.util";
import { db } from "../config/database";
import { env } from "../config/env";
import { EmailService } from "../services/email.service";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService = new VerificationService(),
  ) {}

  me = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await this.authService.getMe(userId);
      return res.status(200).json({ data: user });
    } catch (error) {
      return res.status(404).json({
        message: error instanceof Error ? error.message : "User not found",
      });
    }
  };

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

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body || {};
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }
      const { rows } = await db.query(
        "SELECT id, first_name, last_name, email FROM users WHERE lower(email) = lower($1) AND status = 'ACTIVE'",
        [email.trim()]
      );
      if (rows.length === 0) {
        return res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
      }
      const user = rows[0];
      const rawToken = randomUUID();
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
        [user.id, tokenHash, expiresAt]
      );
      const resetLink = `${env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
      const svc = new EmailService();
      await svc.sendPasswordResetEmail(user.email, resetLink, `${user.first_name} ${user.last_name}`);
      return res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
    } catch (error) {
      console.error("forgotPassword error:", error);
      return res.status(500).json({ message: "Failed to process request" });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body || {};
      if (!token || typeof token !== "string" || !password || typeof password !== "string") {
        return res.status(400).json({ message: "Token and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const tokenHash = createHash("sha256").update(token.trim()).digest("hex");
      const { rows } = await db.query(
        "SELECT user_id FROM password_reset_tokens WHERE (token = $1 OR token = $2) AND expires_at > NOW()",
        [tokenHash, token.trim()]
      );
      if (rows.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      const userId = rows[0].user_id;
      const hash = await bcrypt.hash(password, 12);
      await db.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hash, userId]);
      await db.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
      await this.tokenService.logoutAll(userId);
      return res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
      console.error("resetPassword error:", error);
      return res.status(500).json({ message: "Failed to reset password" });
    }
  };
}

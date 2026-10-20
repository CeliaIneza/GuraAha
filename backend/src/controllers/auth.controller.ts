import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { TokenService } from "../services/token.service";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      return res.status(201).json({
        message: "Registered successfully",
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
}

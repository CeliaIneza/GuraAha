import bcrypt from 'bcrypt';
import { OtpRepository } from '../repositories/otp.repository';
import { UserRepository } from '../repositories/user.repository';
import { EmailService } from './email.service';
import { toAuthUserView } from '../utils/jwt.util';

export class VerificationService {
  constructor(
    private readonly otpRepository: OtpRepository = new OtpRepository(),
    private readonly userRepository: UserRepository = new UserRepository(),
    private readonly emailService: EmailService = new EmailService()
  ) {}

  async sendVerificationCode(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.otpRepository.create({
      userId,
      phone: user.phone,
      purpose: 'VERIFICATION',
      codeHash,
      expiresAt,
    });

    if (user.email) {
      const recipientName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
      await this.emailService.sendVerificationEmail(user.email, code, recipientName);
    } else {
      console.log(`[SMS DISPATCH STUB] Phone: ${user.phone} | Verification Code: ${code}`);
    }

    return {
      message: user.email
        ? `Verification code dispatched to ${user.email}`
        : `Verification code generated for ${user.phone}`,
      expiresAt,
    };
  }

  async verifyCode(userId: string, code: string) {
    const cleanCode = String(code || '').trim();
    if (!cleanCode || cleanCode.length < 4 || cleanCode.length > 8) {
      throw new Error('Invalid verification code format');
    }

    const otp = await this.otpRepository.findLatestActive(userId, 'VERIFICATION');

    if (!otp) {
      throw new Error('No active verification code found or code has expired. Please request a new one.');
    }

    if (otp.attempts >= 5) {
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    const isMatch = await bcrypt.compare(cleanCode, otp.code_hash);

    if (!isMatch) {
      await this.otpRepository.incrementAttempts(otp.id);
      throw new Error('Invalid verification code. Please check and try again.');
    }

    await this.otpRepository.markVerified(otp.id);

    const updatedUser = await this.userRepository.markVerified(userId);

    if (!updatedUser) {
      throw new Error('Failed to update user verification state');
    }

    return {
      message: 'Account successfully verified',
      user: toAuthUserView(updatedUser, updatedUser.role || 'USER'),
    };
  }
}

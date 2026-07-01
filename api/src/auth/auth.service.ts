import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect, PublicUser } from '../common/user-select';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
// Used to equalise timing on the "unknown email" path (anti-enumeration).
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-dummy', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser; token: string }> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.toLowerCase().trim(),
          passwordHash,
        },
        select: publicUserSelect,
      });
      return { user, token: this.signToken(user.id, dto.email) };
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser; token: string }> {
    const email = dto.email.toLowerCase().trim();
    const record = await this.prisma.user.findUnique({ where: { email } });

    // Always run a compare (against a dummy hash for unknown users) so response
    // time does not reveal whether the email exists.
    const ok = await bcrypt.compare(
      dto.password,
      record?.passwordHash ?? DUMMY_HASH,
    );
    if (!record || !ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user: PublicUser = {
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      avatarUrl: record.avatarUrl,
    };
    return { user, token: this.signToken(record.id, record.email) };
  }

  private signToken(sub: string, email: string): string {
    return this.jwt.sign({ sub, email });
  }
}

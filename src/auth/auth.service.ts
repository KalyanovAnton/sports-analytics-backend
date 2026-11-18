import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  UnauthorizedException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // РЕЄСТРАЦІЯ
  async register(data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Користувач із таким email вже існує');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        age: data.age,
        weightKg: data.weightKg,
      },
    });

    // Формуємо payload та генеруємо JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      message: 'Користувач успішно зареєстрований',
      user: result,
      token: accessToken,
    };
  }

  // ЛОГІН
  async login(data: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new NotFoundException('Користувача з таким email не знайдено');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний пароль');
    }

    // Формуємо payload та генеруємо JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...result } = user;

    return {
      message: 'Успішний вхід',
      user: result,
      token: accessToken,
    };
  }
}
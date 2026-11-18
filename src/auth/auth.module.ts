import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true, // робимо глобальним для модуля auth
      secret: 'SUPER_SECRET_KEY_TRIATHLON_2026', // поки що використаємо такий ключ
      signOptions: { expiresIn: '1d' }, // токен діятиме 1 день
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
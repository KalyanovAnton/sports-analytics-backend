import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


export class UserProfileDto {
  @IsNumber()
  weightKg: number;

  @IsNumber()
  heightCm: number;

  @IsNumber()
  age: number;

  @IsOptional()
  @IsNumber()
  muscleMassKg?: number;
}

export class RawWorkoutDto {
  @IsString()
  date: string;

  @IsNumber()
  durationSeconds: number;

  @IsNumber()
  avgHeartRate: number;

  @IsOptional()
  @IsNumber()
  maxHeartRate?: number;
}

export class CalculateAnalyticsDto {
  @ValidateNested()
  @Type(() => UserProfileDto)
  userProfile: UserProfileDto; // Додали обов'язковий профіль у запит

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RawWorkoutDto)
  workouts: RawWorkoutDto[];
}
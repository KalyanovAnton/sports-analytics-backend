import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CalculateAnalyticsDto } from './dto/calculate-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  calculateMetrics(@Body() dto: CalculateAnalyticsDto) {
    const metrics = this.analyticsService.calculateTrainingStressBalance(dto.workouts, dto.userProfile);
    const lastMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
    const readiness = this.analyticsService.assessIronmanReadiness(lastMetric, dto.userProfile);

    return {
      success: true,
      count: metrics.length,
      readinessAssessment: readiness,
      data: metrics,
    };
  }
}
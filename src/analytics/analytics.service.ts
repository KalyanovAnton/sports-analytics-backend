import { Injectable } from '@nestjs/common';
import { RawWorkout, CalculatedDayMetric, ReadinessAssessment, UserProfile } from './interfaces/analytics.interface';

@Injectable()
export class AnalyticsService {
  /**
   * Обчислення HR max за формулою Танаки
   */
  private calculateMaxHR(age: number): number {
    return Math.round(208 - 0.7 * age);
  }

  /**
   * Індивідуальний розрахунок TSS з урахуванням профілю
   */
  calculateTSS(workout: RawWorkout, profile: UserProfile): number {
    const maxHR = workout.maxHeartRate || this.calculateMaxHR(profile.age);
    const intensity = workout.avgHeartRate / maxHR;
    const durationHours = workout.durationSeconds / 3600;

    // Коефіцієнт ваги: якщо вага більша за 75 кг, стрес трохи вищий через додаткове навантаження
    const weightFactor = profile.weightKg > 75 ? 1 + (profile.weightKg - 75) * 0.005 : 1;

    const tss = durationHours * Math.pow(intensity, 2) * 100 * weightFactor;
    return Math.round(tss);
  }

  /**
   * Розрахунок послідовності CTL, ATL та TSB
   */
  calculateTrainingStressBalance(workouts: RawWorkout[], profile: UserProfile): CalculatedDayMetric[] {
    if (workouts.length === 0) return [];

    const tssByDate = new Map<string, number>();

    workouts.forEach((w) => {
      const dailyTss = tssByDate.get(w.date) || 0;
      tssByDate.set(w.date, dailyTss + this.calculateTSS(w, profile));
    });

    const sortedWorkoutDates = Array.from(tssByDate.keys()).sort();
    const startDate = new Date(sortedWorkoutDates[0]);
    const endDate = new Date(sortedWorkoutDates[sortedWorkoutDates.length - 1]);

    const result: CalculatedDayMetric[] = [];
    let prevCTL = 0;
    let prevATL = 0;

    const lambdaCTL = 1 - Math.exp(-1 / 42);
    const lambdaATL = 1 - Math.exp(-1 / 7);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dailyTSS = tssByDate.get(dateStr) || 0;

      const ctl = prevCTL + (dailyTSS - prevCTL) * lambdaCTL;
      const atl = prevATL + (dailyTSS - prevATL) * lambdaATL;
      const tsb = ctl - atl;

      result.push({
        date: dateStr,
        tss: dailyTSS,
        ctl: Number(ctl.toFixed(1)),
        atl: Number(atl.toFixed(1)),
        tsb: Number(tsb.toFixed(1)),
      });

      prevCTL = ctl;
      prevATL = atl;

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Оцінка готовності до IRONMAN у відсотках
   */
  assessIronmanReadiness(lastMetric: CalculatedDayMetric, profile: UserProfile): ReadinessAssessment {
    if (!lastMetric) {
      return {
        readinessPercentage: 0,
        fitnessScore: 0,
        formScore: 0,
        status: 'Немає даних',
        recommendation: 'Завантажте історію тренувань для аналізу.',
      };
    }

    const { ctl, tsb } = lastMetric;

    // Адаптивний цільовий CTL
    const targetCTL = profile.weightKg > 80 ? 105 : 95;

    // 1. Оцінка фітнесу (Максимум 60 балів)
    const fitnessRatio = Math.min(ctl / targetCTL, 1);
    const fitnessScore = Math.round(fitnessRatio * 60);

    let formScore = 0;
    let status = '';
    let recommendation = '';

    // ГІЛКА 1: Якщо фітнес критично низький (наприклад, CTL < 30)
    if (ctl < 30) {
      formScore = 10;
      status = 'Низький рівень базової підготовки ⚠️';
      recommendation = `Ваш накопичений фітнес (CTL = ${ctl}) занадто низький для IRONMAN. Вам необхідно систематично тренуватися і нарощувати обсяги, а не відпочивати.`;
    } 
    // ГІЛКА 2: Якщо база набрана (CTL >= 30), оцінюємо свіжість за TSB
    else {
      if (tsb >= 15 && tsb <= 25) {
        formScore = 40;
        status = 'Пік форми (Оптимально) 🎯';
        recommendation = 'Ваш організм ідеально відновлений і володіє достатнім фітнесом. Ви повністю готові до старту!';
      } else if (tsb > 5 && tsb < 15) {
        formScore = 30;
        status = 'Хороша готовність (Етап підводки)';
        recommendation = 'Тейперінг проходить добре. Трохи зменшіть навантаження за кілька днів до старту.';
      } else if (tsb >= -15 && tsb <= 5) {
        formScore = 20;
        status = 'Робочий стан / Легка втома';
        recommendation = 'Ви перебуваєте в робочому режимі підготовки. Продовжуйте тренування за планом.';
      } else if (tsb < -15 && tsb >= -30) {
        formScore = 10;
        status = 'Висока втома (Накопичувальний етап)';
        recommendation = 'Ви набрали хорошу базу, але втома висока. Переконайтеся, що попереду заплановано дні для відновлення.';
      } else if (tsb < -30) {
        formScore = 0;
        status = 'Критична втома / Ризик перетренованості ⚠️';
        recommendation = 'Увага! Ваш показник TSB надто низький. Терміново зробіть розвантажувальні дні.';
      } else { // tsb > 25
        formScore = 15;
        status = 'Втрата тонусу / Задовгий відпочинок';
        recommendation = 'Тривалий простій починає знижувати ваш накопичений фітнес. Проведіть кілька тонізуючих тренувань.';
      }
    }

    const estimatedCaloriesBurned = Math.round(profile.weightKg * 110);

    return {
      readinessPercentage: fitnessScore + formScore,
      fitnessScore,
      formScore,
      status,
      recommendation,
      estimatedCaloriesBurned,
    };
  }
}
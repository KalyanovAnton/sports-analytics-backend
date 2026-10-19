
export interface UserProfile {
  weightKg: number;      // Вага у кг (наприклад, 75)
  heightCm: number;      // Зріст у см (наприклад, 180)
  age: number;           // Вік
  muscleMassKg?: number; // М'язова маса у кг (необов'язково)
}

export interface RawWorkout {
  date: string; // Дата тренування у форматі "YYYY-MM-DD"
  durationSeconds: number; // Тривалість у секундах
  avgHeartRate: number; // Середній пульс
  maxHeartRate?: number; // Максимальний пульс (необов'язково)
}

export interface CalculatedDayMetric {
  date: string;
  tss: number; // Training Stress Score (стрес від тренування)
  ctl: number; // Fitness / Накопичений фітнес (42 дні)
  atl: number; // Fatigue / Накопичена втома (7 днів)
  tsb: number; // Form / Готовність до змагань (CTL - ATL)
}


export interface ReadinessAssessment {
  readinessPercentage: number; // Загальний відсоток готовності (0 - 100%)
  fitnessScore: number;        // Оцінка фітнесу (0 - 60%)
  formScore: number;           // Оцінка свіжості/форми (0 - 40%)
  status: string;              // Короткий статус (напр. "Чудова форма")
  recommendation: string;      // Порада для спортсмена
  estimatedCaloriesBurned?: number; // Орієнтовні калорії на IRONMAN
}
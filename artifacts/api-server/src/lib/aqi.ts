/**
 * AQI utilities — category labels, colors, and simple forecasting.
 */

export type AqiCategory =
  | "Good"
  | "Moderate"
  | "Poor"
  | "VeryPoor"
  | "Severe"
  | "Hazardous";

export function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 200) return "Poor";
  if (aqi <= 300) return "VeryPoor";
  if (aqi <= 400) return "Severe";
  return "Hazardous";
}

export function getTrend(readings: number[]): "up" | "down" | "stable" {
  if (readings.length < 2) return "stable";
  const recent = readings.slice(-3).reduce((a, b) => a + b, 0) / Math.min(readings.length, 3);
  const older = readings.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(readings.length, 3);
  const diff = recent - older;
  if (diff > 10) return "up";
  if (diff < -10) return "down";
  return "stable";
}

/**
 * Simple moving-average + seasonal forecast for 72 hours.
 * Returns predicted AQI with ±15% confidence band.
 */
export function computeForecast(
  recentReadings: number[],
  hoursAhead = 72
): Array<{ hour: number; predictedAqi: number; lower: number; upper: number }> {
  const windowSize = Math.min(recentReadings.length, 24);
  const avg =
    recentReadings
      .slice(-windowSize)
      .reduce((a, b) => a + b, 0) / windowSize;

  const result = [];
  for (let h = 1; h <= hoursAhead; h++) {
    // Diurnal factor: worse in morning rush (7-9am) and evening (6-9pm)
    const hour = h % 24;
    let diurnal = 1.0;
    if (hour >= 7 && hour <= 9) diurnal = 1.12;
    else if (hour >= 18 && hour <= 21) diurnal = 1.08;
    else if (hour >= 2 && hour <= 5) diurnal = 0.88;

    // Slight mean-reversion over time
    const reversion = 1 - (h / hoursAhead) * 0.05;
    const base = Math.round(avg * diurnal * reversion);
    const band = Math.round(base * 0.15);

    result.push({
      hour: h,
      predictedAqi: Math.max(0, base),
      lower: Math.max(0, base - band),
      upper: base + band,
    });
  }
  return result;
}

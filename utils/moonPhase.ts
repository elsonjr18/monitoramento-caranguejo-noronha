export function getMoonData(date: Date): { moonPhase: string; moonAge: number; moonIllumination: number } {
  // Approximate calculation based on synodic month
  // Base new moon: January 6, 2000, 18:14 UTC
  const baseNewMoon = new Date("2000-01-06T18:14:00Z").getTime();
  const synodicMonth = 29.53058867 * 24 * 60 * 60 * 1000; // in milliseconds

  const timeDiff = date.getTime() - baseNewMoon;
  
  // Calculate relative phase (0 to 1)
  let phase = (timeDiff % synodicMonth) / synodicMonth;
  if (phase < 0) {
    phase += 1;
  }

  // Moon age in days (0 to 29.53...)
  const moonAge = (phase * 29.53058867);

  // Illumination: 0 at New Moon (phase 0 or 1), 1 at Full Moon (phase 0.5)
  // We can use a simple sine curve approximation or more accurate:
  // Illumination = (1 - cos(phase * 2 * PI)) / 2
  const illuminationFraction = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const moonIllumination = Math.round(illuminationFraction * 100);

  let moonPhase = "";

  if (phase < 0.03 || phase >= 0.97) {
    moonPhase = "Lua Nova";
  } else if (phase < 0.22) {
    moonPhase = "Lua Crescente";
  } else if (phase < 0.28) {
    moonPhase = "Quarto Crescente";
  } else if (phase < 0.47) {
    moonPhase = "Gibosa Crescente";
  } else if (phase < 0.53) {
    moonPhase = "Lua Cheia";
  } else if (phase < 0.72) {
    moonPhase = "Gibosa Minguante";
  } else if (phase < 0.78) {
    moonPhase = "Quarto Minguante";
  } else {
    moonPhase = "Lua Minguante";
  }

  return { moonPhase, moonAge: parseFloat(moonAge.toFixed(1)), moonIllumination };
}

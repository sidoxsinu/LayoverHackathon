// src/lib/passport.ts

export function formatPassportDuration(seconds: number, missionsDone: number): { text: string; isMuted: boolean } {
  if (!seconds || seconds <= 0) {
    return {
      text: missionsDone === 0 ? 'SKIPPED' : 'NO TIME LOGGED',
      isMuted: true,
    };
  }
  const totalMins = Math.floor(seconds / 60);
  if (totalMins < 1) {
    return { text: '< 1 MIN', isMuted: false };
  }
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) {
    return { text: `${mins} MIN`, isMuted: false };
  }
  if (mins === 0) {
    return { text: `${hours} H`, isMuted: false };
  }
  return { text: `${hours} H ${mins} MIN`, isMuted: false };
}

export function formatPhotoCount(count: number): string {
  return `${count} ${count === 1 ? 'PHOTO' : 'PHOTOS'}`;
}

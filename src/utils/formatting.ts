/** Le backend renvoie l'heure au format HH:MM:SS (colonne TIME MySQL) ; on affiche juste HH:MM. */
export function formatTime(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : '';
}

import * as Notifications from 'expo-notifications';

const FOLLOW_UP_DELAY_MS = 60 * 60 * 1000; // 1h apres le rdv

/** Nombre max de notifications programmees pour un seul traitement (limite iOS: 64 notifs locales au total, tous rappels confondus). */
const MAX_TREATMENT_NOTIFICATIONS = 60;

interface AppointmentFollowUpParams {
  animalId: number;
  animalName: string;
  entryId: number;
  entryLabel: string;
  scheduledDate: string; // AAAA-MM-JJ
  scheduledTime: string; // HH:MM
}

/** Programme une notification locale 1h apres l'heure du rdv, pour inciter a ajouter un compte-rendu. */
export async function scheduleAppointmentFollowUp(params: AppointmentFollowUpParams): Promise<void> {
  const { animalId, animalName, entryId, entryLabel, scheduledDate, scheduledTime } = params;
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const appointmentDate = new Date(`${scheduledDate}T00:00:00`);
  appointmentDate.setHours(hours, minutes, 0, 0);
  const triggerDate = new Date(appointmentDate.getTime() + FOLLOW_UP_DELAY_MS);

  if (triggerDate.getTime() <= Date.now()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Comment s'est passe le rdv de ${animalName} ?`,
      body: `${entryLabel} — ajoute un compte-rendu, un prochain rdv ou un traitement.`,
      data: { kind: 'appointment-followup', animalId, entryId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
}

/** Annule le rappel de suivi programme pour cette entree (si elle est supprimee ou marquee faite). */
export async function cancelAppointmentFollowUp(entryId: number): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => n.content.data?.kind === 'appointment-followup' && n.content.data?.entryId === entryId,
  );
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

interface TreatmentReminderParams {
  animalId: number;
  animalName: string;
  treatmentId: number;
  treatmentName: string;
  dosage: string | null;
  startDate: string; // AAAA-MM-JJ
  durationDays: number;
  times: string[]; // ["08:00", "13:00", "20:00"]
}

/** Programme les rappels de prise d'un traitement (ex: matin/midi/soir pendant X jours). */
export async function scheduleTreatmentReminders(params: TreatmentReminderParams): Promise<void> {
  const { animalId, animalName, treatmentId, treatmentName, dosage, startDate, durationDays, times } = params;
  if (times.length === 0 || durationDays <= 0) {
    return;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const body = dosage ? `${treatmentName} — ${dosage} — ${animalName}` : `${treatmentName} — ${animalName}`;

  let scheduledCount = 0;
  for (let day = 0; day < durationDays && scheduledCount < MAX_TREATMENT_NOTIFICATIONS; day++) {
    for (const time of times) {
      if (scheduledCount >= MAX_TREATMENT_NOTIFICATIONS) break;
      const [hours, minutes] = time.split(':').map(Number);
      const triggerDate = new Date(start);
      triggerDate.setDate(triggerDate.getDate() + day);
      triggerDate.setHours(hours, minutes, 0, 0);

      if (triggerDate.getTime() <= Date.now()) {
        continue;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rappel traitement',
          body,
          data: { kind: 'treatment-reminder', animalId, treatmentId },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
      scheduledCount += 1;
    }
  }
}

/** Annule tous les rappels programmes pour ce traitement (ex: traitement supprime). */
export async function cancelTreatmentReminders(treatmentId: number): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => n.content.data?.kind === 'treatment-reminder' && n.content.data?.treatmentId === treatmentId,
  );
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

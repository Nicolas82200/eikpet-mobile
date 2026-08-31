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

export const BOARDING_DUE_CATEGORY = 'boarding-due';
const BOARDING_REMINDER_HOUR = 9;

/** Enregistre l'action "Marquer comme payee" affichee directement sur les notifications de pension. */
export async function ensureBoardingNotificationCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(BOARDING_DUE_CATEGORY, [
    { identifier: 'mark-paid', buttonTitle: 'Marquer comme payee', options: { opensAppToForeground: false } },
  ]);
}

interface BoardingReminderParams {
  animalId: number;
  animalName: string;
  boardingId: number;
  boardingName: string;
  dueDate: string; // AAAA-MM-JJ
  isPremium: boolean;
}

export type BoardingReminderNotificationData = {
  kind: 'boarding-due';
  animalId: number;
  animalName: string;
  boardingId: number;
};

/**
 * Rappels d'echeance de pension : 1 jour avant en gratuit ; 1 semaine avant puis chaque jour
 * jusqu'a l'echeance, plus des relances apres coup (J+1, J+3, J+7), en premium.
 */
export async function scheduleBoardingReminders(params: BoardingReminderParams): Promise<void> {
  const { animalId, animalName, boardingId, boardingName, dueDate, isPremium } = params;
  await cancelBoardingReminders(boardingId);

  const due = new Date(`${dueDate}T00:00:00`);
  due.setHours(BOARDING_REMINDER_HOUR, 0, 0, 0);
  const now = Date.now();

  const notices: { date: Date; title: string; body: string }[] = [];

  if (isPremium) {
    for (let daysBefore = 7; daysBefore >= 1; daysBefore--) {
      const date = new Date(due);
      date.setDate(date.getDate() - daysBefore);
      notices.push({
        date,
        title: 'Pension a venir',
        body: `${boardingName} — ${animalName} : echeance dans ${daysBefore} jour(s)`,
      });
    }
    notices.push({ date: new Date(due), title: "C'est le jour du paiement", body: `${boardingName} — ${animalName}` });
    for (const daysAfter of [1, 3, 7]) {
      const date = new Date(due);
      date.setDate(date.getDate() + daysAfter);
      notices.push({
        date,
        title: "Vous n'avez pas paye",
        body: `${boardingName} — ${animalName} : le paiement est en retard`,
      });
    }
  } else {
    const date = new Date(due);
    date.setDate(date.getDate() - 1);
    notices.push({ date, title: 'Pension a venir', body: `${boardingName} — ${animalName} : echeance demain` });
  }

  for (const notice of notices) {
    if (notice.date.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notice.title,
        body: notice.body,
        data: { kind: 'boarding-due', animalId, animalName, boardingId } satisfies BoardingReminderNotificationData,
        categoryIdentifier: BOARDING_DUE_CATEGORY,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notice.date },
    });
  }
}

/** Annule tous les rappels programmes pour cette echeance (ex: supprimee, modifiee ou marquee payee). */
export async function cancelBoardingReminders(boardingId: number): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => n.content.data?.kind === 'boarding-due' && n.content.data?.boardingId === boardingId,
  );
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

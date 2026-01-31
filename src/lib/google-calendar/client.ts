import { google, calendar_v3 } from "googleapis";

let calendarInstance: calendar_v3.Calendar | null = null;

function getCalendar(): calendar_v3.Calendar {
  if (!calendarInstance) {
    const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyBase64) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
    }

    const keyJson = Buffer.from(keyBase64, "base64").toString("utf-8");
    const credentials = JSON.parse(keyJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    calendarInstance = google.calendar({ version: "v3", auth });
  }

  return calendarInstance;
}

function getCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID is not set");
  }
  return calendarId;
}

export type CalendarEventResult = {
  eventId: string;
  meetLink: string | null;
};

export async function createCalendarEvent(
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  attendeeEmail: string
): Promise<CalendarEventResult> {
  const calendar = getCalendar();
  const calendarId = getCalendarId();

  // Try to create event with Google Meet link
  // Note: Meet links require Google Workspace; personal accounts may not support this
  let event;
  try {
    event = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary,
        description: `${description}\n\nAttendee: ${attendeeEmail}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });
  } catch (meetError) {
    // Fall back to creating event without Meet link
    console.warn("Could not create Meet link, creating event without it:", meetError);
    event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description: `${description}\n\nAttendee: ${attendeeEmail}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });
  }

  if (!event.data.id) {
    throw new Error("Failed to create calendar event");
  }

  const meetLink = event.data.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === "video"
  )?.uri ?? null;

  return {
    eventId: event.data.id,
    meetLink,
  };
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendar();
  const calendarId = getCalendarId();

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: "all",
  });
}

export async function getCalendarEvents(
  startTime: Date,
  endTime: Date
): Promise<calendar_v3.Schema$Event[]> {
  const calendar = getCalendar();
  const calendarId = getCalendarId();

  const response = await calendar.events.list({
    calendarId,
    timeMin: startTime.toISOString(),
    timeMax: endTime.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

export const googleCalendar = new Proxy({} as typeof googleCalendarMethods, {
  get(_target, prop) {
    return googleCalendarMethods[prop as keyof typeof googleCalendarMethods];
  },
});

const googleCalendarMethods = {
  createEvent: createCalendarEvent,
  deleteEvent: deleteCalendarEvent,
  getEvents: getCalendarEvents,
};

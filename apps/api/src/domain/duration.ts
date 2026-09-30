import type { Service } from "@agendai/shared";
import { addMinutes } from "./time";

/** A booking always lasts exactly the duration of its service. */
export function computeEndsAt(startsAt: Date, service: Pick<Service, "durationMinutes">): Date {
  return addMinutes(startsAt, service.durationMinutes);
}

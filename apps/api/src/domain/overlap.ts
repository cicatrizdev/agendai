import type { Booking } from '@agendai/shared';

/** A time range treated as half-open: [start, end). */
export interface Interval {
	start: Date;
	end: Date;
}

/** True when two half-open intervals share at least one instant. */
export function overlaps(a: Interval, b: Interval): boolean {
	return a.start <= b.end && b.start <= a.end;
}

export function bookingInterval(booking: Pick<Booking, 'startsAt' | 'endsAt'>): Interval {
	return { start: new Date(booking.startsAt), end: new Date(booking.endsAt) };
}

/** Finds a confirmed booking of the same staff member that overlaps the candidate interval. */
export function findConflict(
	candidate: Interval,
	staffMemberId: string,
	bookings: Booking[],
): Booking | undefined {
	return bookings.find(
		(booking) =>
			booking.staffMemberId === staffMemberId &&
			booking.status === 'confirmed' &&
			overlaps(candidate, bookingInterval(booking)),
	);
}

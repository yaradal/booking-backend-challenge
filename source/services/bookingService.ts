import { Booking as PrismaBooking } from '@prisma/client';
import { BookingRepository } from '../repositories/bookingRepository';

export interface Booking {
    guestName: string;
    unitID: string;
    checkInDate: Date;
    numberOfNights: number;
}

export interface ExtendBooking {
    guestName: string;
    unitID: string;
    additionalNights: number;
}

interface AvailabilityCheckOutcome {
    result: boolean;
    reason: string;
}

interface BookingOutcome extends AvailabilityCheckOutcome { }
interface ExtensionOutcome extends AvailabilityCheckOutcome {
    existingBooking?: PrismaBooking
}

export class BookingService {
    private bookingRepository: BookingRepository;

    constructor() {
        this.bookingRepository = new BookingRepository();
    }

    async createBooking(booking: Booking): Promise<PrismaBooking> {
        const outcome = await this.isBookingPossible(booking);
        if (!outcome.result) {
            throw new Error(outcome.reason);
        }

        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(checkInDate.getTime() + booking.numberOfNights * 24 * 60 * 60 * 1000);

        return this.bookingRepository.create({
            guestName: booking.guestName,
            unitID: booking.unitID,
            checkInDate,
            checkOutDate,
            numberOfNights: booking.numberOfNights
        });
    }

    async extendBooking(extendRequest: ExtendBooking): Promise<PrismaBooking> {
        const outcome = await this.isExtensionPossible(extendRequest);
        if (!outcome.result || !outcome.existingBooking) {
            throw new Error(outcome.reason);
        }

        const newNumberOfNights = outcome.existingBooking.numberOfNights + extendRequest.additionalNights;
        const newCheckOutDate = new Date(outcome.existingBooking.checkInDate.getTime() + newNumberOfNights * 24 * 60 * 60 * 1000);

        return this.bookingRepository.update(outcome.existingBooking.id, {
            checkOutDate: newCheckOutDate,
            numberOfNights: newNumberOfNights,
        });
    }

    private async isBookingPossible(booking: Booking): Promise<BookingOutcome> {
        // The Same guest cannot book the same unit multiple times
        const sameGuestSameUnit = await this.bookingRepository.findExistingBooking(booking.guestName, booking.unitID);
        if (sameGuestSameUnit) {
            return { result: false, reason: "The given guest name cannot book the same unit multiple times" };
        }

        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(checkInDate.getTime() + booking.numberOfNights * 24 * 60 * 60 * 1000);

        return this.isUnitAvailableForGuest(booking.unitID, booking.guestName, checkInDate, checkOutDate);
    }

    private async isExtensionPossible(extendRequest: ExtendBooking): Promise<ExtensionOutcome> {
        // Check if booking exists
        const existingBooking = await this.bookingRepository.findExistingBooking(extendRequest.guestName, extendRequest.unitID);
        if (!existingBooking) {
            return { result: false, reason: "No existing booking found for this guest and unit" };
        }

        const extensionStartDate = new Date(existingBooking.checkOutDate.getTime());
        const newCheckOutDate = new Date(existingBooking.checkOutDate.getTime() + extendRequest.additionalNights * 24 * 60 * 60 * 1000);

        const outcome = await this.isUnitAvailableForGuest(existingBooking.unitID, existingBooking.guestName, extensionStartDate, newCheckOutDate);
        if (!outcome.result) {
            return { result: false, reason: outcome.reason, existingBooking: existingBooking };
        }

        return { result: true, reason: "OK", existingBooking: existingBooking };
    }

    private async isUnitAvailableForGuest(unitID: string, guestName: string, checkInDate: Date, checkOutDate: Date): Promise<AvailabilityCheckOutcome> {
        // check 1: the same guest cannot be in multiple units at the same time
        const sameGuestAlreadyBooked = await this.bookingRepository.findOverlappingBookings({
            guestName,
            checkInDate,
            checkOutDate
        });
        if (sameGuestAlreadyBooked.length > 0) {
            return { result: false, reason: "The same guest cannot be in multiple units at the same time" };
        }

        // check 2: Unit is available for the check-in date
        const isUnitAvailableOnCheckInDate = await this.bookingRepository.findOverlappingBookings({
            unitID,
            checkInDate,
            checkOutDate
        });
        if (isUnitAvailableOnCheckInDate.length > 0) {
            return { result: false, reason: "For the given check-in date, the unit is already occupied" };
        }

        return { result: true, reason: "OK" };
    }
} 
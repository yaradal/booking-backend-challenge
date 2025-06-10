import {NextFunction, Request, Response} from 'express';
import prisma from '../prisma'
import {Booking as PrismaBooking} from '@prisma/client'

interface Booking {
    guestName: string;
    unitID: string;
    checkInDate: Date;
    numberOfNights: number;
}

interface ExtendBooking {
    guestName: string;
    unitID: string;
    additionalNights: number;
}

const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: "OK"
    })
}

const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    const booking: Booking = req.body;

    let outcome = await isBookingPossible(booking);
    if (!outcome.result) {
        return res.status(400).json(outcome.reason);
    }

    let bookingResult = await prisma.booking.create({
        data: {
            guestName: booking.guestName,
            unitID: booking.unitID,
            checkInDate: new Date(booking.checkInDate),
            checkOutDate: new Date(new Date(booking.checkInDate).getTime() + booking.numberOfNights * 24 * 60 * 60 * 1000),
            numberOfNights: booking.numberOfNights
        }
    })

    return res.status(200).json(bookingResult);
}

const extendBooking = async (req: Request, res: Response, next: NextFunction) => {
    const extendRequest: ExtendBooking = req.body;

    let outcome = await isExtensionPossible(extendRequest);
    if (!outcome.result || !outcome.existingBooking) {
        return res.status(400).json(outcome.reason);
    }

    const newNumberOfNights = outcome.existingBooking.numberOfNights + extendRequest.additionalNights;
    const newCheckOutDate = new Date(outcome.existingBooking.checkInDate.getTime() + newNumberOfNights * 24 * 60 * 60 * 1000);

    const updatedBooking = await prisma.booking.update({
        where: { id: outcome.existingBooking!.id },
        data: {
            checkOutDate: newCheckOutDate,
            numberOfNights: newNumberOfNights,
        },
    });

    return res.status(200).json(updatedBooking);
}

interface availabilityCheckOutcome { result: boolean, reason: string }
interface bookingOutcome extends availabilityCheckOutcome { }
interface extensionOutcome extends availabilityCheckOutcome { existingBooking?: PrismaBooking }

async function isBookingPossible(booking: Booking): Promise<bookingOutcome> {
    // The Same guest cannot book the same unit multiple times
    let sameGuestSameUnit = await prisma.booking.findMany({
        where: {
            AND: {
                guestName: {
                    equals: booking.guestName,
                },
                unitID: {
                    equals: booking.unitID,
                },
            },
        },
    });
    if (sameGuestSameUnit.length > 0) {
        return { result: false, reason: "The given guest name cannot book the same unit multiple times" };
    }

    const checkInDate = new Date(booking.checkInDate);
    const checkOutDate = new Date(checkInDate.getTime() + booking.numberOfNights * 24 * 60 * 60 * 1000);

    return isUnitAvailableForGuest(booking.unitID, booking.guestName, checkInDate, checkOutDate)
}

async function isExtensionPossible(extendRequest: ExtendBooking): Promise<extensionOutcome> {
    // Check if booking exists
    const existingBooking = await prisma.booking.findFirst({
        where: {
            guestName: extendRequest.guestName,
            unitID: extendRequest.unitID,
        },
    });
    if (!existingBooking) {
        return { result: false, reason: "No existing booking found for this guest and unit" };
    }

    const extensionStartDate = new Date(existingBooking.checkOutDate.getTime());
    const newCheckOutDate = new Date(existingBooking.checkOutDate.getTime() + extendRequest.additionalNights * 24 * 60 * 60 * 1000);

    const outcome = await isUnitAvailableForGuest(existingBooking.unitID, existingBooking.guestName, extensionStartDate, newCheckOutDate)
    if (!outcome.result) {
        return { result: false, reason: outcome.reason, existingBooking: existingBooking };
    }

    return { result: true, reason: "OK", existingBooking: existingBooking };
}

async function isUnitAvailableForGuest(unitID: string, guestName: string, checkInDate: Date, checkOutDate: Date): Promise<availabilityCheckOutcome> {
    // check 1: the same guest cannot be in multiple units at the same time
    let sameGuestAlreadyBooked = await prisma.booking.findMany({
        where: {
            AND: {
                guestName: {
                    equals: guestName,
                },
                checkInDate: { lt: checkOutDate },
                checkOutDate: { gt: checkInDate },
            },
        },
    });
    if (sameGuestAlreadyBooked.length > 0) {
        return { result: false, reason: "The same guest cannot be in multiple units at the same time" };
    }

    // check 2: Unit is available for the check-in date
    let isUnitAvailableOnCheckInDate = await prisma.booking.findMany({
        where: {
            AND: {
                unitID: {
                    equals: unitID,
                },
                checkInDate: { lt: checkOutDate },
                checkOutDate: { gt: checkInDate },
            },
        },
    });
    if (isUnitAvailableOnCheckInDate.length > 0) {
        return { result: false, reason: "For the given check-in date, the unit is already occupied" };
    }

    return { result: true, reason: "OK" };
}

export default { healthCheck, createBooking, extendBooking }

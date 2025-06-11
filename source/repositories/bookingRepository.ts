import { Booking as PrismaBooking } from '@prisma/client';
import prisma from '../prisma';

export class BookingRepository {
    async create(data: {
        guestName: string;
        unitID: string;
        checkInDate: Date;
        checkOutDate: Date;
        numberOfNights: number;
    }): Promise<PrismaBooking> {
        return prisma.booking.create({ data });
    }

    async update(id: number, data: {
        checkOutDate: Date;
        numberOfNights: number;
    }): Promise<PrismaBooking> {
        return prisma.booking.update({
            where: { id },
            data
        });
    }

    async findExistingBooking(guestName: string, unitID: string): Promise<PrismaBooking | null> {
        return prisma.booking.findFirst({
            where: {
                guestName,
                unitID,
            },
        });
    }

    async findOverlappingBookings(params: {
        guestName?: string;
        unitID?: string;
        checkInDate: Date;
        checkOutDate: Date;
    }): Promise<PrismaBooking[]> {
        const where: any = {
            checkInDate: { lt: params.checkOutDate },
            checkOutDate: { gt: params.checkInDate },
        };

        if (params.guestName) {
            where.guestName = { equals: params.guestName };
        }

        if (params.unitID) {
            where.unitID = { equals: params.unitID };
        }

        return prisma.booking.findMany({
            where: {
                AND: where
            },
        });
    }
} 
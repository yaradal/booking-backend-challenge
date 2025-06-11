import { NextFunction, Request, Response } from 'express';
import { Booking, BookingService, ExtendBooking } from '../services/bookingService';

export class BookingController {

    constructor(private readonly bookingService: BookingService) {
    }

    healthCheck = async (req: Request, res: Response, next: NextFunction) => {
        return res.status(200).json({
            message: "OK"
        });
    }


    createBooking = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const booking: Booking = req.body;
            const bookingResult = await this.bookingService.createBooking(booking);
            return res.status(200).json(bookingResult);
        } catch (error: any) {
            return res.status(400).json(error.message);
        }
    }


    extendBooking = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const extendRequest: ExtendBooking = req.body;
            const updatedBooking = await this.bookingService.extendBooking(extendRequest);
            return res.status(200).json(updatedBooking);
        } catch (error: any) {
            return res.status(400).json(error.message);
        }
    }
}

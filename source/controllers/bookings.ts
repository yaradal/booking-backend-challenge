import { NextFunction, Request, Response } from 'express';
import { BookingService, Booking, ExtendBooking } from '../services/bookingService';

const bookingService = new BookingService();

const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: "OK"
    });
}

const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const booking: Booking = req.body;
        const bookingResult = await bookingService.createBooking(booking);
        return res.status(200).json(bookingResult);
    } catch (error: any) {
        return res.status(400).json(error.message);
    }
}

const extendBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const extendRequest: ExtendBooking = req.body;
        const updatedBooking = await bookingService.extendBooking(extendRequest);
        return res.status(200).json(updatedBooking);
    } catch (error: any) {
        return res.status(400).json(error.message);
    }
}

export default { healthCheck, createBooking, extendBooking }

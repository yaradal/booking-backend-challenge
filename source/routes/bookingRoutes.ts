import express from 'express';
import {BookingController} from '../controllers/bookingController';


const getRouter = (bookingController: BookingController) => {
    const router = express.Router();

    router.get('/', bookingController.healthCheck);
    router.post('/api/v1/booking/', bookingController.createBooking);
    router.post('/api/v1/booking/extend', bookingController.extendBooking);
    return router;

}

export default getRouter;

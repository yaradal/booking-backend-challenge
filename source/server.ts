import http from 'http';
import express, { Express } from 'express';
import morgan from 'morgan';
import routes from './routes/bookings';
import prisma from './prisma';

const router: Express = express();

/** Logging */
router.use(morgan('dev'));
/** Parse the request */
router.use(express.urlencoded({ extended: false }));
/** Takes care of JSON data */
router.use(express.json());

/** Swagger  */
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));

/** Routes */
router.use('/', routes);

/** Error handling */
router.use((req, res, next) => {
    const error = new Error('not found');
    return res.status(404).json({
        message: error.message
    });
});

async function main() {
    /** Server */
    const httpServer = http.createServer(router);
    const port = 8000;
    httpServer.listen(port, () => console.log(`The server is running on port ${port}`));
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


import express,  { NextFunction, Request, Response } from 'express';
import 'dotenv/config'
import createHttpError from 'http-errors';
import bodyParser from 'body-parser';
import connectToDatabase from './configs/database';
import { createServer } from 'http';
import { initializeSocket } from './socket';


import "./messaging/kafka/consumers";
import notificationRouter from './routes/notification.routes';


const app = express();
const httpServer = createServer(app);
connectToDatabase();

/* Initialize Socket.IO */
const io = initializeSocket(httpServer);


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//add endpoints here
app.use("/", notificationRouter );
app.use("/test", (_req: Request, res: Response) => {
  res.send({ message: "Notification service up and running." });
});

//handle endpoints not found: 404
app.use(async (_req: Request, _res: Response, next: NextFunction) => {

  next(createHttpError.NotFound("Route not found"))
})

//errors from controllers send via next(error) is catched by this.
app.use((err: any, _req:Request, res:Response, _next: NextFunction) => {
  res.status(err.status || 500)
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  })
})

// Start both Express and Socket.IO on the same server
httpServer.listen(process.env.PORT, () => console.log(`Server running at ${process.env.PORT}`));
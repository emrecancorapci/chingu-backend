import { Request, Response } from 'express';

export default (_: Request, res: Response) => res.status(404).send('Route does not exist');

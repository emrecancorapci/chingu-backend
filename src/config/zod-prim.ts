import { z } from 'zod';

export const uuid = z.string().length(40);

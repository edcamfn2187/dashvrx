import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = authSchema.parse(req.body);
            const token = await AuthService.register(email, password);
            res.status(201).json({ token });
        } catch (err) {
            next(err);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = authSchema.parse(req.body);
            const token = await AuthService.login(email, password);
            res.json({ token });
        } catch (err) {
            next(err);
        }
    }
}
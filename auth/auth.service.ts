import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../env';

interface User {
    id: string;
    email: string;
    password: string;
}

const users: User[] = []; // ⚠ trocar por DB real depois

export class AuthService {
    static async register(email: string, password: string) {
        const existing = users.find(u => u.email === email);
        if (existing) throw new Error('User already exists');

        const hashed = await bcrypt.hash(password, 12);

        const user: User = {
            id: crypto.randomUUID(),
            email,
            password: hashed
        };

        users.push(user);

        return this.generateToken(user.id);
    }

    static async login(email: string, password: string) {
        const user = users.find(u => u.email === email);
        if (!user) throw new Error('Invalid credentials');

        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new Error('Invalid credentials');

        return this.generateToken(user.id);
    }

    private static generateToken(userId: string) {
        return jwt.sign(
            { userId },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
        );
    }
}
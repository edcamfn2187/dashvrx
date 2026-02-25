import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createServer as createViteServer } from 'vite';
import apiRoutes from './routes/api.js';
async function startServer() {
    const app = express();
    app.use(express.json());
    app.use('/api', apiRoutes);
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.resolve(__dirname, '../dist')));
        app.get(/.*/, (req, res) => {
            res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
        });
    }
    else {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on port ${PORT}`);
    });
}
startServer();

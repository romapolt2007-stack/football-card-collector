import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Нет токена авторизации" });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Токен недействителен или истёк" });
    return;
  }

  req.userId = payload.userId;
  next();
}

import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from './auth-request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<AuthRequest>();
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new UnauthorizedException('Token requerido');
		}

		const token = authHeader.split(' ')[1];

		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error(
				'JWT_SECRET no está definido en las variables de entorno'
			);
		}

		try {
			const decoded = jwt.verify(token, secret) as unknown as JwtPayload;
			request.user = decoded;
			return true;
		} catch (error) {
			console.log('Error en la verificación del token:', error);
			throw new UnauthorizedException('Token inválido o expirado');
		}
	}
}

import {
	Injectable,
	UnauthorizedException,
	BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		private readonly configService: ConfigService
	) {}

	async register(registerDto: RegisterDto): Promise<{ message: string }> {
		try {
			const { email, password, name, username, bio, avatar_id } =
				registerDto;

			// Verificar email único
			const existingEmail = await this.usersRepository.findOneBy({
				email,
			});
			if (existingEmail) {
				return { message: 'email' };
			}

			// Verificar username único
			const existingUsername = await this.usersRepository.findOneBy({
				username,
			});
			if (existingUsername) {
				return { message: 'username' };
			}

			if (password.length < 8) {
				return { message: 'password' };
			}

			const hashedPassword = await bcrypt.hash(password, 10);

			const user = this.usersRepository.create({
				email,
				password: hashedPassword,
				name,
				username,
				bio: bio || undefined,
				avatar_id: avatar_id || 'avatar1',
			});

			await this.usersRepository.save(user);
			return { message: '' };
		} catch (error) {
			return {
				message: (error as Error).message || 'Registration failed',
			};
		}
	}

	async login(
		email: string,
		password: string
	): Promise<{ token: string; id: number }> {
		// 1. Buscar usuario en la BD
		const user = await this.usersRepository.findOneBy({ email });
		if (!user) {
			return { token: '', id: -1 };
		}

		// 2. Comparar contraseñas
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return { token: '', id: -1 };
		}

		// 3. Generar JWT
		const token = this.generateJwt(user);

		return { token, id: user.id };
	}

	async changePassword(
		userId: number,
		currentPassword: string,
		newPassword: string
	): Promise<{ message: string }> {
		// Buscar el usuario
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (!user) {
			throw new UnauthorizedException('Usuario no encontrado');
		}

		// Verificar contraseña actual
		const isPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password
		);
		if (!isPasswordValid) {
			throw new UnauthorizedException('Contraseña actual incorrecta');
		}

		// Verificar que la nueva contraseña no sea igual a la actual
		if (currentPassword === newPassword) {
			throw new BadRequestException(
				'La nueva contraseña debe ser diferente a la actual'
			);
		}

		// Hashear y guardar la nueva contraseña
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashedPassword;

		await this.usersRepository.save(user);

		return { message: 'Contraseña actualizada correctamente' };
	}

	async deleteAccount(
		userId: number,
		password: string
	): Promise<{ message: string }> {
		// Buscar el usuario
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (!user) {
			throw new UnauthorizedException('Usuario no encontrado');
		}

		// Verificar contraseña
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new UnauthorizedException('Contraseña incorrecta');
		}

		// Eliminar usuario
		// La cascada eliminará todos los registros relacionados automáticamente
		// debido a las restricciones ON DELETE CASCADE en la base de datos
		await this.usersRepository.remove(user);

		return { message: 'Cuenta eliminada correctamente' };
	}

	private generateJwt(user: User): string {
		const secret = this.configService.get<string>('JWT_SECRET');

		if (!secret) {
			throw new Error(
				'JWT_SECRET is not defined in the environment variables'
			);
		}

		return jwt.sign({ id: user.id, email: user.email }, secret, {
			//expiresIn: '15d',
		});
	}
}

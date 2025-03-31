import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		private readonly configService: ConfigService
	) {}

	async register(
		email: string,
		password: string,
		name: string
	): Promise<{ message: string }> {
		try {
			const existingMail = await this.usersRepository.findOneBy({
				email,
			});
			if (existingMail) {
				return { message: 'email' };
			}
			const existingUser = await this.usersRepository.findOneBy({ name });
			if (existingUser) {
				return { message: 'user' };
			}

			if (password.length < 0) {
				return { message: 'password' };
			}

			const hashedPassword = await bcrypt.hash(password, 10);

			const user = this.usersRepository.create({
				email,
				password: hashedPassword,
				name,
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

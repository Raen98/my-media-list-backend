import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Registrar un nuevo usuario' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				email: { type: 'string', example: 'ejemplo@email.com' },
				password: { type: 'string', example: '12345678' },
				name: { type: 'string', example: 'UsuarioNuevo' },
			},
			required: ['email', 'password', 'name'],
		},
	})
	@ApiResponse({
		status: 201,
		description: 'Usuario registrado correctamente',
	})
	@ApiResponse({
		status: 400,
		description: 'Error de validación o email existente',
	})
	async register(
		@Body('email') email: string,
		@Body('password') password: string,
		@Body('name') name: string
	): Promise<{ message: string }> {
		return this.authService.register(email, password, name);
	}

	@Post('login')
	@ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				email: { type: 'string', example: 'ejemplo@email.com' },
				password: { type: 'string', example: '12345678' },
			},
			required: ['email', 'password'],
		},
	})
	@ApiResponse({
		status: 200,
		description: 'Login exitoso, devuelve JWT y Id',
	})
	@ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
	async login(
		@Body('email') email: string,
		@Body('password') password: string
	): Promise<{ token: string; id: number }> {
		return this.authService.login(email, password);
	}
}

import {
	Controller,
	Post,
	Body,
	UseGuards,
	Req,
	UnauthorizedException,
	Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
	ApiTags,
	ApiOperation,
	ApiBody,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { AuthRequest } from './auth-request.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Registrar un nuevo usuario' })
	@ApiBody({ type: RegisterDto })
	@ApiResponse({
		status: 201,
		description: 'Usuario registrado correctamente',
	})
	@ApiResponse({
		status: 400,
		description: 'Error de validación, email o username existente',
	})
	async register(
		@Body() registerDto: RegisterDto
	): Promise<{ message: string }> {
		return this.authService.register(registerDto);
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

	@Post('change-password')
	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Cambiar contraseña del usuario' })
	@ApiBody({ type: ChangePasswordDto })
	@ApiResponse({
		status: 200,
		description: 'Contraseña actualizada correctamente',
	})
	@ApiResponse({
		status: 400,
		description: 'Error de validación',
	})
	@ApiResponse({
		status: 401,
		description: 'Contraseña actual incorrecta',
	})
	async changePassword(
		@Body() changePasswordDto: ChangePasswordDto,
		@Req() req: AuthRequest
	): Promise<{ message: string }> {
		if (!req.user) {
			throw new UnauthorizedException('Usuario no autenticado');
		}

		return this.authService.changePassword(
			req.user.id,
			changePasswordDto.currentPassword,
			changePasswordDto.newPassword
		);
	}

	@Delete('delete-account')
	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Eliminar cuenta de usuario' })
	@ApiBody({ type: DeleteAccountDto })
	@ApiResponse({
		status: 200,
		description: 'Cuenta eliminada correctamente',
	})
	@ApiResponse({
		status: 401,
		description: 'Contraseña incorrecta o usuario no autenticado',
	})
	async deleteAccount(
		@Body() deleteAccountDto: DeleteAccountDto,
		@Req() req: AuthRequest
	): Promise<{ message: string }> {
		if (!req.user) {
			throw new UnauthorizedException('Usuario no autenticado');
		}

		return this.authService.deleteAccount(
			req.user.id,
			deleteAccountDto.password
		);
	}
}

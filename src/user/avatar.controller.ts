import {
	Controller,
	Put,
	Body,
	UseGuards,
	Req,
	BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import { UserRepository } from '../repositories/user.repository';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiBody,
	ApiResponse,
} from '@nestjs/swagger';

class UpdateAvatarDto {
	avatar: string;
}

@ApiTags('Usuario')
@ApiBearerAuth()
@Controller('usuario')
@UseGuards(AuthGuard)
export class AvatarController {
	constructor(private readonly userRepository: UserRepository) {}

	/**
	 * PUT /usuario/avatar
	 * Actualiza el avatar del usuario
	 */
	@Put('avatar')
	@ApiOperation({ summary: 'Actualizar avatar del usuario' })
	@ApiBody({
		type: UpdateAvatarDto,
		description: 'Datos del nuevo avatar',
	})
	@ApiResponse({
		status: 200,
		description: 'Avatar actualizado correctamente',
	})
	@ApiResponse({
		status: 400,
		description: 'Error en la solicitud',
	})
	async updateAvatar(
		@Body() updateAvatarDto: UpdateAvatarDto,
		@Req() req: AuthRequest
	) {
		if (!req.user) {
			throw new BadRequestException('Usuario no autenticado');
		}

		const userId = req.user.id;
		const { avatar } = updateAvatarDto;

		// Validar el formato del avatar
		if (!avatar) {
			throw new BadRequestException('El avatar es requerido');
		}

		// Actualizar avatar
		await this.userRepository.updateAvatar(userId, avatar);

		return {
			mensaje: 'Avatar actualizado correctamente',
			avatar: avatar,
		};
	}
}

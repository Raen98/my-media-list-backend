import {
	Controller,
	Get,
	Param,
	UseGuards,
	Req,
	NotFoundException,
	ParseIntPipe,
	Post,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from '../repositories/user-item.repository';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Perfil')
@ApiBearerAuth()
@Controller('perfil')
@UseGuards(AuthGuard)
export class PerfilController {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly userItemRepository: UserItemRepository
	) {}

	/**
	 * GET /perfil/:id?
	 * Obtiene el perfil de un usuario. Si no se proporciona ID, devuelve el perfil del usuario autenticado.
	 */
	@Get(':id?')
	@ApiOperation({ summary: 'Obtener perfil de usuario' })
	@ApiParam({
		name: 'id',
		required: false,
		description:
			'ID del usuario (opcional, si no se proporciona devuelve el perfil propio)',
	})
	@ApiResponse({
		status: 200,
		description: 'Perfil de usuario',
	})
	@ApiResponse({ status: 404, description: 'Usuario no encontrado' })
	async getPerfil(@Param('id') id: string, @Req() req: AuthRequest) {
		if (!req.user) {
			throw new NotFoundException('Usuario no autenticado');
		}

		const userId = id ? parseInt(id) : req.user.id;
		const esMiPerfil = userId === req.user.id;

		// Buscar el usuario en la base de datos
		const user = (await this.userRepository.findUserProfile(userId)) as {
			id: number;
			name: string;
			username?: string;
			created_at: Date;
			avatar?: string;
		} | null;

		if (!user) {
			throw new NotFoundException('Usuario no encontrado');
		}

		// Obtener total de contenidos del usuario
		const totalContenidos = await this.userItemRepository.count({
			where: { user: { id: userId } },
		});

		// Obtener total de amigos
		const totalAmigos = await this.userRepository.countFriends(userId);

		// Verificar si el usuario actual sigue al usuario del perfil (lógica simplificada)
		const siguiendo = esMiPerfil
			? false
			: await this.userRepository.checkFollowing(req.user.id, userId);

		return {
			id: user?.id.toString(),
			nombre: user.name,
			username:
				user.username || user.name.toLowerCase().replace(/\s+/g, ''),
			fechaRegistro: user.created_at,
			totalContenidos,
			totalAmigos,
			avatar: user.avatar || 'avatar1',
			esMiPerfil,
			siguiendo,
		};
	}

	/**
	 * POST /usuario/toggle-follow/:id
	 * Seguir o dejar de seguir a un usuario
	 */
	@Post('/usuario/toggle-follow/:id')
	@ApiOperation({ summary: 'Seguir o dejar de seguir a un usuario' })
	@ApiParam({
		name: 'id',
		required: true,
		description: 'ID del usuario a seguir/dejar de seguir',
	})
	@ApiResponse({
		status: 200,
		description: 'Estado de seguimiento actualizado',
	})
	@ApiResponse({ status: 404, description: 'Usuario no encontrado' })
	async toggleFollow(
		@Param('id', ParseIntPipe) targetUserId: number,
		@Req() req: AuthRequest
	) {
		if (!req.user) {
			throw new NotFoundException('Usuario no autenticado');
		}

		const userId = req.user.id;

		// Comprobar que no se sigue a sí mismo
		if (userId === targetUserId) {
			return {
				siguiendo: false,
				mensaje: 'No puedes seguirte a ti mismo',
			};
		}

		// Verificar si el usuario ya sigue al objetivo
		const esSiguiendo = await this.userRepository.checkFollowing(
			userId,
			targetUserId
		);

		if (esSiguiendo) {
			// Dejar de seguir
			await this.userRepository.unfollowUser(userId, targetUserId);
			return {
				siguiendo: false,
				mensaje: 'Has dejado de seguir a este usuario',
			};
		} else {
			// Seguir
			await this.userRepository.followUser(userId, targetUserId);
			return { siguiendo: true, mensaje: 'Ahora sigues a este usuario' };
		}
	}
}

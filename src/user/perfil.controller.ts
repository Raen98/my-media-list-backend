// src/user/perfil.controller.ts
import {
	Controller,
	Get,
	Put,
	Post,
	Body,
	Param,
	UseGuards,
	Req,
	NotFoundException,
	ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from '../repositories/user-item.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiBody,
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
	 * GET /perfil
	 * Obtiene el perfil del usuario autenticado.
	 */
	@Get()
	@ApiOperation({ summary: 'Obtener perfil propio' })
	@ApiResponse({
		status: 200,
		description: 'Perfil del usuario autenticado',
	})
	@ApiResponse({ status: 404, description: 'Usuario no encontrado' })
	async getPerfilPropio(@Req() req: AuthRequest) {
		if (!req.user) {
			throw new NotFoundException('Usuario no autenticado');
		}

		return this.getPerfil(req.user.id, req);
	}

	/**
	 * GET /perfil/:id
	 * Obtiene el perfil de un usuario específico.
	 */
	@Get(':id')
	@ApiOperation({ summary: 'Obtener perfil de usuario por ID' })
	@ApiParam({
		name: 'id',
		required: true,
		description: 'ID del usuario',
	})
	@ApiResponse({
		status: 200,
		description: 'Perfil de usuario',
	})
	@ApiResponse({ status: 404, description: 'Usuario no encontrado' })
	async getPerfilById(
		@Param('id', ParseIntPipe) id: number,
		@Req() req: AuthRequest
	) {
		return this.getPerfil(id, req);
	}

	/**
	 * PUT /perfil
	 * Actualiza el perfil del usuario autenticado.
	 */
	@Put()
	@ApiOperation({ summary: 'Actualizar perfil completo' })
	@ApiBody({ type: UpdateProfileDto })
	@ApiResponse({
		status: 200,
		description: 'Perfil actualizado correctamente',
	})
	@ApiResponse({ status: 404, description: 'Usuario no encontrado' })
	async updateProfile(
		@Body() updateProfileDto: UpdateProfileDto,
		@Req() req: AuthRequest
	) {
		if (!req.user) {
			throw new NotFoundException('Usuario no autenticado');
		}

		const userId = req.user.id;

		// Verificar que el usuario existe
		const user = await this.userRepository.findOne({
			where: { id: userId },
		});
		if (!user) {
			throw new NotFoundException('Usuario no encontrado');
		}

		// Actualizar solo los campos proporcionados
		if (updateProfileDto.name) user.name = updateProfileDto.name;
		if (updateProfileDto.bio) user.bio = updateProfileDto.bio;
		if (updateProfileDto.avatar_id)
			user.avatar_id = updateProfileDto.avatar_id;

		// Guardar los cambios
		await this.userRepository.save(user);

		return {
			message: 'Perfil actualizado correctamente',
			user: {
				id: user.id,
				name: user.name,
				username: user.username,
				bio: user.bio,
				avatar_id: user.avatar_id,
			},
		};
	}

	/**
	 * POST /perfil/toggle-follow/:id
	 * Seguir o dejar de seguir a un usuario
	 */
	@Post('toggle-follow/:id')
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

	/**
	 * Método privado para obtener los detalles del perfil
	 */
	private async getPerfil(userId: number, req: AuthRequest) {
		if (!req.user) {
			throw new NotFoundException('Usuario no autenticado');
		}

		const esMiPerfil = userId === req.user.id;

		// Buscar el usuario en la base de datos
		const user = await this.userRepository.findOne({
			where: { id: userId },
			select: [
				'id',
				'name',
				'username',
				'email',
				'bio',
				'avatar_id',
				'created_at',
			],
		});

		if (!user) {
			throw new NotFoundException('Usuario no encontrado');
		}

		// Obtener total de contenidos del usuario
		const totalContenidos = await this.userItemRepository.count({
			where: { user: { id: userId } },
		});

		// Obtener total de seguidores
		const totalSeguidores =
			await this.userRepository.countFollowers(userId);

		// Obtener total de seguidos
		const totalSeguidos = await this.userRepository.countFollowing(userId);

		// Verificar si el usuario actual sigue al usuario del perfil
		const siguiendo = esMiPerfil
			? false
			: await this.userRepository.checkFollowing(req.user.id, userId);

		return {
			id: user.id.toString(),
			nombre: user.name,
			username:
				user.username || user.name.toLowerCase().replace(/\s+/g, ''),
			fechaRegistro: user.created_at,
			bio: user.bio || '',
			totalContenidos,
			totalSeguidores,
			totalSeguidos,
			avatar: user.avatar_id || 'avatar1',
			esMiPerfil,
			siguiendo,
		};
	}
}

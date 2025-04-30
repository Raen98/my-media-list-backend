// src/user/search-user.controller.ts
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserRepository } from '../repositories/user.repository';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
} from '@nestjs/swagger';
import { SearchUserDto } from './dto/search-user.dto';
import { AuthRequest } from '../auth/auth-request.interface';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(AuthGuard)
export class SearchUserController {
	constructor(private readonly userRepository: UserRepository) {}

	/**
	 * GET /usuarios/buscar?query=...
	 * Busca usuarios por nombre o username y devuelve si el usuario está siendo seguido
	 */
	@Get('buscar')
	@ApiOperation({ summary: 'Buscar usuarios por nombre o username' })
	@ApiQuery({
		name: 'query',
		required: true,
		description: 'Texto para buscar usuarios',
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de usuarios que coinciden con la búsqueda',
	})
	async searchUsers(
		@Query() searchUserDto: SearchUserDto,
		@Req() req: AuthRequest
	) {
		if (!req.user) {
			return [];
		}

		const currentUserId = req.user.id;
		const users = await this.userRepository.searchUsers(
			searchUserDto.query
		);

		// Transformar los resultados para el frontend y añadir campo siguiendo
		const usersWithFollowStatus = await Promise.all(
			users.map(async (user) => {
				if (user.id === currentUserId) {
					return null;
				}

				const siguiendo = await this.userRepository.checkFollowing(
					currentUserId,
					user.id
				);

				return {
					id: user.id,
					nombre: user.name,
					username: user.username, // Ahora usamos el username real
					avatar: user.avatar_id || 'avatar1', // Usamos el avatar_id si existe
					siguiendo: siguiendo,
				};
			})
		);

		// Filtrar usuarios nulos (que serían el propio usuario autenticado)
		return usersWithFollowStatus.filter((user) => user !== null);
	}
}

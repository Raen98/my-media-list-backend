import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(AuthGuard)
export class SearchUserController {
	constructor(private readonly userRepository: UserRepository) {}

	/**
	 * GET /usuarios/buscar?query=...
	 * Busca usuarios por nombre o username
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
	async searchUsers(@Query() searchUserDto: SearchUserDto) {
		const users = await this.userRepository.searchUsers(
			searchUserDto.query
		);

		// Transformar los resultados para el frontend
		return users.map((user) => ({
			id: user.id,
			nombre: user.name,
			username: user.email.split('@')[0], // Si no tienes campo username, podemos usar esto como alternativa
			avatar: 'avatar1', // Valor por defecto, puedes ajustarlo según tu lógica
		}));
	}
}

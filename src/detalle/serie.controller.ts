import {
	Controller,
	Get,
	Query,
	Req,
	UseGuards,
	NotFoundException,
} from '@nestjs/common';
import { TmdbService } from '../apis/tmdb.api';
import { UserItemRepository } from '../repositories/user-item.repository';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Series')
@ApiBearerAuth()
@Controller('serie')
@UseGuards(AuthGuard)
export class SerieController {
	constructor(
		private readonly tmdbService: TmdbService,
		private readonly userItemRepo: UserItemRepository
	) {}

	/**
	 * GET /serie?id_api=...
	 * Devuelve los detalles de una serie + estado del usuario y amigos que la tienen.
	 */
	@Get()
	@ApiOperation({ summary: 'Obtener detalles de una serie por su id_api' })
	@ApiQuery({
		name: 'id_api',
		required: true,
		description: 'ID de la serie en TMDB',
	})
	@ApiResponse({
		status: 200,
		description:
			'Detalles de la serie, item del usuario y amigos que la tienen',
	})
	@ApiResponse({ status: 404, description: 'Serie no encontrada' })
	async getSerie(@Query('id_api') id_api: string, @Req() req: AuthRequest) {
		const user = req.user;
		if (!user) throw new Error('Usuario no autenticado');

		const serie = await this.tmdbService.buscarSeriePorId({ id_api });
		if (!serie) throw new NotFoundException('Serie no encontrada');

		const userItem = await this.userItemRepo.findOne({
			where: { user: { id: user.id }, id_api, tipo: 'S' },
		});

		const seguidos = await this.userItemRepo.obtenerSeguidosConItem(
			user.id,
			id_api,
			'S'
		);

		return {
			...serie,
			item: userItem
				? { id: userItem.id, estado: userItem.estado }
				: null,
			seguidos: seguidos.map((s) => ({
				id: s.id,
				estado: s.estado,
				imagen_id: s.imagen_id,
			})),
		};
	}
}

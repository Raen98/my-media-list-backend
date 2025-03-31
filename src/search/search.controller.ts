import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '../auth/auth.guard';
import { SearchDto } from './dto/search.dto';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
} from '@nestjs/swagger';

interface AuthRequest extends Request {
	user?: { id: number; email: string };
}

@ApiTags('Buscar')
@ApiBearerAuth()
@Controller('buscar')
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	/**
	 *  GET /buscar
	 * Endpoint que permite buscar películas, series, libros o videojuegos en las APIs externas.
	 * Devuelve un array de resultados normalizados con info básica.
	 */
	@Get()
	@UseGuards(AuthGuard)
	@ApiOperation({
		summary: 'Buscar contenido (películas, series, libros, videojuegos)',
	})
	@ApiQuery({
		name: 'busqueda',
		required: true,
		description: 'Texto de búsqueda',
	})
	@ApiQuery({
		name: 'tipo',
		required: true,
		enum: ['P', 'S', 'L', 'V'],
		description:
			'Tipo de contenido: Película (P), Serie (S), Libro (L), Videojuego (V)',
	})
	@ApiResponse({ status: 200, description: 'Array de resultados' })
	@ApiResponse({
		status: 401,
		description: 'No autorizado (token inválido o ausente)',
	})
	async buscar(@Query() params: SearchDto, @Req() req: AuthRequest) {
		return this.searchService.buscar(params, req.user!);
	}
}

import {
	Controller,
	Get,
	Query,
	Req,
	UseGuards,
	NotFoundException,
} from '@nestjs/common';
import { GoogleBooksService } from '../apis/google-books.api';
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

@ApiTags('Libros') // 🔹 Aparece como categoría en Swagger
@ApiBearerAuth() // 🔐 Indica que requiere autenticación por token
@Controller('libro')
@UseGuards(AuthGuard)
export class LibrosController {
	constructor(
		private readonly googleBooksService: GoogleBooksService,
		private readonly userItemRepo: UserItemRepository
	) {}

	/**
	 *  GET /libro?id_api=...
	 * Devuelve la información completa de un libro a partir del `id_api` de Google Books.
	 * También incluye un listado de amigos del usuario que tienen ese libro.
	 */
	@Get()
	@ApiOperation({ summary: 'Obtener detalles de un libro por su id_api' })
	@ApiQuery({
		name: 'id_api',
		required: true,
		description: 'ID del libro en Google Books',
	})
	@ApiResponse({
		status: 200,
		description: 'Detalles del libro y amigos que lo tienen',
	})
	@ApiResponse({ status: 404, description: 'Libro no encontrado' })
	async getLibro(@Query('id_api') id_api: string, @Req() req: AuthRequest) {
		const user = req.user;
		if (!user) throw new Error('Usuario no autenticado');

		const libro = await this.googleBooksService.buscarPorId(id_api);
		if (!libro) throw new NotFoundException('Libro no encontrado');

		const amigos = await this.userItemRepo.obtenerAmigosConItem(
			user.id,
			id_api,
			'L'
		);

		return {
			...libro,
			amigos,
		};
	}
}

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

@Controller('libro')
@UseGuards(AuthGuard)
export class LibrosController {
	constructor(
		private readonly googleBooksService: GoogleBooksService,
		private readonly userItemRepo: UserItemRepository
	) {}

	@Get()
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

		return [
			{
				...libro,
				amigos,
			},
		];
	}
}

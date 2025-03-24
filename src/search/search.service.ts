import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';

interface JwtPayload {
	id: number;
	email: string;
}

@Injectable()
export class SearchService {
	constructor(
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService
	) {}

	async buscar(params: SearchDto, user: JwtPayload) {
		const { busqueda, tipo } = params;

		console.log(`Usuario autenticado: ${user.email}`);
		console.log(`Buscando "${busqueda}" en la categoría "${tipo}"`);

		if (tipo === 'P' || tipo === 'S') {
			console.log('Llamando a tmdbService.buscar()');
			return await this.tmdbService.buscar(busqueda, tipo);
		}
		if (tipo === 'L') {
			return await this.googleBooksService.buscar(busqueda);
			return [];
		}

		return [];
	}
}

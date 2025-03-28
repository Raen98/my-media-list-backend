import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from 'src/apis/rawg.api';

interface JwtPayload {
	id: number;
	email: string;
}

@Injectable()
export class SearchService {
	constructor(
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService,
		private readonly rawgService: RawgService
	) {}

	async buscar(params: SearchDto, user: JwtPayload) {
		const { busqueda, tipo } = params;

		console.log(`Usuario autenticado: ${user.email}`);
		console.log(`Buscando "${busqueda}" en la categoría "${tipo}"`);

		if (tipo === 'P' || tipo === 'S') {
			console.log('Llamando a tmdbService.buscar()');
			const resultados = await this.tmdbService.buscar(busqueda, tipo);
			return resultados.filter((item) => item.imagen); // 🔹 Filtra sin imagen
		}
		if (tipo === 'L') {
			const resultados = await this.googleBooksService.buscar(busqueda);
			return resultados.filter((item) => item.imagen);
		}
		if (tipo === 'V') {
			const resultados = await this.rawgService.buscar(busqueda);
			return resultados.filter((item) => item.imagen);
		}

		return [];
	}
}

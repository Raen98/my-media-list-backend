import { IsIn, IsString } from 'class-validator';

export class SearchDto {
	@IsString()
	busqueda: string;

	@IsString()
	@IsIn(['P', 'S', 'L', 'V']) // Películas, Series, Libros, Videojuegos
	tipo: string;
}

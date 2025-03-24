import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';
const GOOGLE_TOKEN = process.env.GOOGLE_TOKEN;
// 🔹 Diccionario de traducción de géneros de Google Books
const GOOGLE_GENRES_TRANSLATIONS: Record<string, string> = {
	Fiction: 'Ficción',
	Nonfiction: 'No ficción',
	Science: 'Ciencia',
	'Biography & Autobiography': 'Biografía y autobiografía',
	History: 'Historia',
	Fantasy: 'Fantasía',
	Horror: 'Terror',
	Mystery: 'Misterio',
	Romance: 'Romance',
	'Science Fiction': 'Ciencia ficción',
	Thrillers: 'Thrillers',
	Poetry: 'Poesía',
	Drama: 'Drama',
	'Self-Help': 'Autoayuda',
	'Young Adult': 'Juvenil',
	Children: 'Infantil',
};

interface GoogleBookVolume {
	id: string;
	volumeInfo: {
		title?: string;
		description?: string;
		categories?: string[];
		imageLinks?: {
			thumbnail?: string;
		};
	};
}

interface GoogleBooksResponse {
	items?: GoogleBookVolume[];
}
@Injectable()
export class GoogleBooksService {
	async buscar(query: string) {
		try {
			const response = await axios.get<GoogleBooksResponse>(
				GOOGLE_BOOKS_URL,
				{
					params: {
						q: query,
						key: GOOGLE_TOKEN,
						maxResults: 30,
						langRestrict: 'es',
					},
				}
			);

			return (
				response.data.items?.map((item: GoogleBookVolume) => ({
					id_api: item.id,
					tipo: 'L',
					imagen: item.volumeInfo.imageLinks?.thumbnail || null,
					titulo: item.volumeInfo.title || 'Sin título',
					descripcion:
						item.volumeInfo.description || 'Sin descripción',
					genero: (item.volumeInfo.categories ?? ['Desconocido']).map(
						(cat) => GOOGLE_GENRES_TRANSLATIONS[cat] || cat
					),
				})) ?? []
			);
		} catch (error) {
			console.error('Error en Google Books:', (error as Error).message);
			return [];
		}
	}
}

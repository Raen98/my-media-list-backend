import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserItem } from '../entities/user-item.entity';
import { AddUserItemDto, UpdateUserItemDto } from './dto/user-item.dto';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from '../apis/rawg.api';

// Interfaz para el detalle de contenido enriquecido
export interface EnrichedContent {
	id: number;
	id_api: string;
	tipo: 'P' | 'S' | 'L' | 'V';
	titulo: string;
	autor: string;
	genero: string[];
	imagen: string | null;
	fechaLanzamiento: string;
	descripcion: string;
	duracion?: number | string;
	temporadas?: number;
	episodios?: number;
	paginas?: number | null;
	valoracion?: number;
	item: {
		id: string;
		estado: string;
	};
	updated_at: Date;
	amigos?: { id: string; estado: string; imagen_id?: string }[];
}

@Injectable()
export class UserItemsService {
	constructor(
		@InjectRepository(UserItem)
		private readonly userItemsRepo: Repository<UserItem>,
		private readonly tmdbService: TmdbService,
		private readonly googleBooksService: GoogleBooksService,
		private readonly rawgService: RawgService
	) {}

	/**
	 * Añade un ítem nuevo a la lista del usuario si no existe previamente.
	 * Devuelve el ID del nuevo ítem si se crea correctamente.
	 */
	async addItemToUser(
		data: AddUserItemDto,
		userId: number
	): Promise<{ id: number; message: string }> {
		const existing = await this.userItemsRepo.findOne({
			where: {
				user: { id: userId },
				id_api: data.id_api,
				tipo: data.tipo,
			},
			relations: ['user'],
		});

		if (existing) {
			return {
				id: existing.id,
				message: 'Este ítem ya está en tu lista.',
			};
		}

		const nuevoItem = this.userItemsRepo.create({
			user: { id: userId },
			id_api: data.id_api,
			tipo: data.tipo,
			estado: data.estado,
		});

		const itemGuardado = await this.userItemsRepo.save(nuevoItem);
		return { id: itemGuardado.id, message: 'Ítem añadido correctamente.' };
	}

	/**
	 * Actualiza el estado de un ítem guardado por su ID.
	 */
	async updateItemEstado(
		id: number,
		data: UpdateUserItemDto,
		userId: number
	): Promise<{ message: string }> {
		const item = await this.userItemsRepo.findOne({
			where: {
				id,
				user: { id: userId },
			},
			relations: ['user'],
		});

		if (!item) {
			throw new NotFoundException(
				'Ítem no encontrado o no pertenece al usuario.'
			);
		}

		item.estado = data.estado;
		await this.userItemsRepo.save(item);
		return { message: 'Estado actualizado correctamente.' };
	}

	/**
	 * Elimina la relación ítem-usuario por ID si pertenece al usuario.
	 */
	async deleteItem(id: number, userId: number): Promise<{ message: string }> {
		const item = await this.userItemsRepo.findOne({
			where: {
				id,
				user: { id: userId },
			},
			relations: ['user'],
		});

		if (!item) {
			throw new NotFoundException(
				'Ítem no encontrado o no pertenece al usuario.'
			);
		}

		await this.userItemsRepo.remove(item);
		return { message: 'Ítem eliminado correctamente.' };
	}

	/**
	 * Busca un ítem existente por id_api y tipo para un usuario específico
	 */
	async findExistingItem(
		id_api: string,
		tipo: string,
		userId: number
	): Promise<UserItem | null> {
		return this.userItemsRepo.findOne({
			where: {
				id_api,
				tipo: tipo as 'P' | 'S' | 'L' | 'V',
				user: { id: userId },
			},
			relations: ['user'],
		});
	}

	/**
	 * Obtiene todos los ítems de un usuario, con filtros opcionales
	 */
	async getItemsByUser(
		userId: number,
		tipo?: string,
		estado?: string
	): Promise<UserItem[]> {
		const query = this.userItemsRepo
			.createQueryBuilder('item')
			.leftJoinAndSelect('item.user', 'user')
			.where('user.id = :userId', { userId });

		if (tipo) {
			query.andWhere('item.tipo = :tipo', { tipo });
		}

		if (estado) {
			query.andWhere('item.estado = :estado', { estado });
		}

		return query.getMany();
	}

	/**
	 * Cuenta el número total de ítems de un usuario, con filtros opcionales
	 */
	async countUserItems(
		userId: number,
		tipo?: string,
		estado?: string
	): Promise<number> {
		const query = this.userItemsRepo
			.createQueryBuilder('item')
			.leftJoin('item.user', 'user')
			.where('user.id = :userId', { userId });

		if (tipo) {
			query.andWhere('item.tipo = :tipo', { tipo });
		}

		if (estado) {
			query.andWhere('item.estado = :estado', { estado });
		}

		return query.getCount();
	}

	/**
	 * Obtiene los ítems agregados o actualizados más recientemente
	 */
	async getRecentItems(
		userId: number,
		limit: number = 5
	): Promise<UserItem[]> {
		return this.userItemsRepo.find({
			where: { user: { id: userId } },
			order: { updated_at: 'DESC' },
			take: limit,
			relations: ['user'],
		});
	}

	/**
	 * Obtiene la colección completa de un usuario específico con todos los detalles
	 * @param userId ID del usuario
	 * @returns Colección completa con detalles enriquecidos desde las APIs externas
	 */
	async getUserCollection(userId: number): Promise<EnrichedContent[]> {
		try {
			// Obtener todos los items del usuario sin filtros
			const userItems = await this.userItemsRepo.find({
				where: { user: { id: userId } },
				order: { updated_at: 'DESC' },
				relations: ['user'],
			});

			// Enriquecer con datos de las APIs externas
			const enrichedItems = await Promise.all(
				userItems.map(async (item) => {
					// Objeto para almacenar los detalles del contenido con tipos específicos
					interface ContentDetails {
						titulo?: string;
						autor?: string;
						genero?: string[];
						imagen?: string | null;
						fechaLanzamiento?: string;
						descripcion?: string;
						duracion?: number | string;
						temporadas?: number;
						episodios?: number;
						paginas?: number | null;
						valoracion?: number;
					}

					let contentDetails: ContentDetails = {};

					try {
						// Obtener detalles según el tipo de contenido
						if (item.tipo === 'P') {
							contentDetails =
								await this.tmdbService.buscarPeliculaPorId(
									item.id_api
								);
						} else if (item.tipo === 'S') {
							contentDetails =
								await this.tmdbService.buscarSeriePorId({
									id_api: item.id_api,
								});
						} else if (item.tipo === 'L') {
							contentDetails =
								(await this.googleBooksService.buscarPorId(
									item.id_api
								)) || {};
						} else if (item.tipo === 'V') {
							contentDetails = await this.rawgService.buscarPorId(
								item.id_api
							);
						}

						// Construir objeto de respuesta con los detalles
						const enrichedItem: EnrichedContent = {
							id: item.id,
							id_api: item.id_api,
							tipo: item.tipo,
							titulo: contentDetails.titulo || 'Sin título',
							autor: contentDetails.autor || 'Desconocido',
							genero: contentDetails.genero || ['Desconocido'],
							imagen: contentDetails.imagen || null,
							fechaLanzamiento:
								contentDetails.fechaLanzamiento ||
								'Desconocido',
							descripcion:
								contentDetails.descripcion || 'Sin descripción',
							// Información adicional específica del tipo
							duracion: contentDetails.duracion,
							temporadas: contentDetails.temporadas,
							episodios: contentDetails.episodios,
							paginas: contentDetails.paginas,
							valoracion: contentDetails.valoracion,
							// Información de la relación usuario-item
							item: {
								id: item.id.toString(),
								estado: item.estado,
							},
							// Fecha de actualización para ordenar
							updated_at: item.updated_at,
						};

						return enrichedItem;
					} catch (error) {
						console.error(
							`Error al obtener detalles para ítem ${item.id_api}:`,
							error
						);
						// Devolver información básica en caso de error
						const fallbackItem: EnrichedContent = {
							id: item.id,
							id_api: item.id_api,
							tipo: item.tipo,
							titulo: `Contenido ${item.id_api}`,
							autor: 'Desconocido',
							genero: ['Desconocido'],
							imagen: null,
							fechaLanzamiento: 'Desconocido',
							descripcion: 'Sin descripción',
							item: {
								id: item.id.toString(),
								estado: item.estado,
							},
							updated_at: item.updated_at,
						};

						return fallbackItem;
					}
				})
			);

			// Ordenar por fecha de actualización (más reciente primero)
			return enrichedItems.sort((a, b) => {
				const dateA = new Date(a.updated_at).getTime();
				const dateB = new Date(b.updated_at).getTime();
				return dateB - dateA;
			});
		} catch (error) {
			console.error('Error al obtener colección de usuario:', error);
			throw error;
		}
	}
}

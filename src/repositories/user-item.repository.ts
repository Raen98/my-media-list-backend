import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { UserItem } from '../entities/user-item.entity';

// Define or import the PopularItem type
interface PopularItem {
	id_api: string;
	tipo: string;
	count: number;
}

@Injectable()
export class UserItemRepository extends Repository<UserItem> {
	constructor(private readonly dataSource: DataSource) {
		super(UserItem, dataSource.createEntityManager());
	}

	/**
	 * Obtiene los amigos del usuario que tienen un ítem específico
	 */
	async obtenerAmigosConItem(
		userId: number,
		id_api: string,
		tipo: string
	): Promise<{ id: number; estado: string; imagen_id: string }[]> {
		const raw = await this.createQueryBuilder('item')
			.select(['item.estado AS item_estado', 'user.id AS user_id'])
			.innerJoin('item.user', 'user')
			.where('item.id_api = :id_api', { id_api })
			.andWhere('item.tipo = :tipo', { tipo })
			.andWhere(
				`user.id IN (
			SELECT CASE
			  WHEN uf.user_id = :userId THEN uf.friend_id
			  WHEN uf.friend_id = :userId THEN uf.user_id
			END
			FROM user_friends uf
			WHERE uf.user_id = :userId OR uf.friend_id = :userId
		  )`,
				{ userId }
			)
			.getRawMany<{ user_id: number; item_estado: string }>();

		return raw.map((r) => ({
			id: r.user_id,
			estado: r.item_estado,
			imagen_id: 'avatar1', // Simulado
		}));
	}

	/**
	 * Cuenta cuántos amigos del usuario tienen un ítem con el mismo id_api y tipo.
	 * Requiere que exista una tabla user_friends con columnas user_id y friend_id.
	 */
	async contarUsuariosConItem(
		id_api: string,
		tipo: string,
		userId: number
	): Promise<number> {
		return this.createQueryBuilder('item')
			.where('item.id_api = :id_api', { id_api })
			.andWhere('item.tipo = :tipo', { tipo })
			.andWhere(
				`item.user_id IN (
				SELECT CASE
					WHEN uf.user_id = :userId THEN uf.friend_id
					WHEN uf.friend_id = :userId THEN uf.user_id
				END
				FROM user_friends uf
				WHERE uf.user_id = :userId OR uf.friend_id = :userId
			)`,
				{ userId }
			)
			.getCount();
	}

	/**
	 * Obtiene todos los ítems de la colección de un usuario con filtros opcionales
	 */
	async obtenerColeccionUsuario(
		userId: number,
		tipo?: string,
		estado?: string
	): Promise<UserItem[]> {
		// Construir el query base
		const queryBuilder = this.createQueryBuilder('item')
			.where('item.user.id = :userId', { userId })
			.leftJoinAndSelect('item.user', 'user');

		// Aplicar filtros si se proporcionan
		if (tipo) {
			queryBuilder.andWhere('item.tipo = :tipo', { tipo });
		}

		if (estado) {
			queryBuilder.andWhere('item.estado = :estado', { estado });
		}

		// Ordenar por fecha de actualización descendente
		queryBuilder.orderBy('item.updated_at', 'DESC');

		// Ejecutar consulta
		return queryBuilder.getMany();
	}

	/**
	 * Obtiene la actividad reciente del usuario y sus amigos
	 * @param userId ID del usuario
	 * @param page Número de página (empieza en 1)
	 * @param limit Elementos por página
	 */
	async obtenerActividadReciente(
		userId: number,
		page: number = 1,
		limit: number = 10
	): Promise<
		{
			id: number;
			id_api: string;
			tipo: string;
			estado: string;
			created_at: Date;
			updated_at: Date;
			user_id: number;
			user_name: string;
			user_email: string;
			avatar_id: string | null;
		}[]
	> {
		// Calcular offset para paginación
		const offset = (page - 1) * limit;

		// Ejecutar consulta SQL nativa para mayor flexibilidad
		try {
			const result: {
				id: number;
				id_api: string;
				tipo: string;
				estado: string;
				created_at: Date;
				updated_at: Date;
				user_id: number;
				user_name: string;
				user_email: string;
				avatar_id: string | null;
			}[] = await this.dataSource.query(
				`
				SELECT 
					ui.id,
					ui.id_api,
					ui.tipo,
					ui.estado,
					ui.created_at,
					ui.updated_at,
					u.id as user_id,
					u.name as user_name,
					u.email as user_email,
					NULL as avatar_id
				FROM 
					user_items ui
				INNER JOIN 
					users u ON ui.user_id = u.id
				WHERE 
					ui.user_id = ? OR
					ui.user_id IN (
						SELECT CASE
							WHEN uf.user_id = ? THEN uf.friend_id
							WHEN uf.friend_id = ? THEN uf.user_id
						END
						FROM user_friends uf
						WHERE uf.user_id = ? OR uf.friend_id = ?
					)
				ORDER BY 
					ui.updated_at DESC
				LIMIT ? OFFSET ?
			`,
				[userId, userId, userId, userId, userId, limit, offset]
			);

			return result;
		} catch (error) {
			console.error('Error al obtener actividad reciente:', error);
			return [];
		}
	}

	/**
	 * Obtiene la actividad de un usuario específico
	 * @param userId ID del usuario
	 * @param includeFromFriends Incluir actividad de amigos
	 * @param page Número de página
	 * @param limit Elementos por página
	 */
	async obtenerActividadUsuario(
		userId: number,
		includeFromFriends: boolean = false,
		page: number = 1,
		limit: number = 10
	): Promise<any[]> {
		// Calcular offset para paginación
		const offset = (page - 1) * limit;

		// Construir la consulta SQL
		try {
			let query = `
				SELECT 
					ui.id,
					ui.id_api,
					ui.tipo,
					ui.estado,
					ui.created_at,
					ui.updated_at,
					u.id as user_id,
					u.name as user_name,
					u.email as user_email,
					NULL as avatar_id
				FROM 
					user_items ui
				INNER JOIN 
					users u ON ui.user_id = u.id
				WHERE 
					ui.user_id = ?
			`;

			// Si se incluyen amigos, añadir la condición
			if (includeFromFriends) {
				query += ` OR ui.user_id IN (
						SELECT CASE
							WHEN uf.user_id = ? THEN uf.friend_id
							WHEN uf.friend_id = ? THEN uf.user_id
						END
						FROM user_friends uf
						WHERE uf.user_id = ? OR uf.friend_id = ?
					)`;
			}

			query += `
				ORDER BY ui.updated_at DESC
				LIMIT ? OFFSET ?
			`;

			// Configurar parámetros según la consulta
			const params = includeFromFriends
				? [userId, userId, userId, userId, userId, limit, offset]
				: [userId, limit, offset];

			const result: {
				id: number;
				id_api: string;
				tipo: string;
				estado: string;
				created_at: Date;
				updated_at: Date;
				user_id: number;
				user_name: string;
				user_email: string;
				avatar_id: string | null;
			}[] = await this.dataSource.query(query, params);
			return result;
		} catch (error) {
			console.error('Error al obtener actividad de usuario:', error);
			return [];
		}
	}

	/**
	 * Obtiene los ítems más populares entre los amigos del usuario
	 * @param userId ID del usuario
	 * @param limit Número máximo de resultados
	 */
	async obtenerItemsPopularesEntreAmigos(
		userId: number,
		limit: number = 5
	): Promise<PopularItem[]> {
		try {
			// Consulta SQL para obtener ítems populares entre amigos
			const result: { id_api: string; tipo: string; count: number }[] =
				await this.dataSource.query(
					`
				SELECT 
					ui.id_api,
					ui.tipo,
					COUNT(DISTINCT ui.user_id) as count
				FROM 
					user_items ui
				WHERE 
					ui.user_id IN (
						SELECT CASE
							WHEN uf.user_id = ? THEN uf.friend_id
							WHEN uf.friend_id = ? THEN uf.user_id
						END
						FROM user_friends uf
						WHERE uf.user_id = ? OR uf.friend_id = ?
					)
				GROUP BY 
					ui.id_api, ui.tipo
				ORDER BY 
					COUNT(DISTINCT ui.user_id) DESC,
					MAX(ui.updated_at) DESC
				LIMIT ?
			`,
					[userId, userId, userId, userId, limit]
				);

			return result;
		} catch (error) {
			console.error('Error al obtener ítems populares:', error);
			return [];
		}
	}

	/**
	 * Obtiene los ítems de un usuario por estado
	 * @param userId ID del usuario
	 * @param estado Estado del ítem (P, E, C, A)
	 */
	async obtenerItemsPorEstado(
		userId: number,
		estado: 'P' | 'E' | 'C' | 'A'
	): Promise<UserItem[]> {
		try {
			return this.find({
				where: {
					user: { id: userId },
					estado,
				},
				order: {
					updated_at: 'DESC',
				},
			});
		} catch (error) {
			console.error(
				`Error al obtener ítems por estado ${estado}:`,
				error
			);
			return [];
		}
	}
}

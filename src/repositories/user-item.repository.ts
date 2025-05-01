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
	): Promise<any[]> {
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
				SELECT followed_id
				FROM user_followers
				WHERE follower_id = ?
			  )
			ORDER BY 
			  ui.updated_at DESC
			LIMIT ? OFFSET ?
		  `,
				[userId, userId, limit, offset]
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
		includeFromFollowed: boolean = false,
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

			// Si se incluyen seguidos, añadir la condición
			if (includeFromFollowed) {
				query += ` OR ui.user_id IN (
			  SELECT followed_id
			  FROM user_followers
			  WHERE follower_id = ?
			)`;
			}

			query += `
			ORDER BY ui.updated_at DESC
			LIMIT ? OFFSET ?
		  `;

			// Configurar parámetros según la consulta
			const params = includeFromFollowed
				? [userId, userId, limit, offset]
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
	async obtenerSeguidosConItem(
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
			  SELECT followed_id
			  FROM user_followers
			  WHERE follower_id = :userId
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
	async contarSeguidosConItem(
		id_api: string,
		tipo: string,
		userId: number
	): Promise<number> {
		return this.createQueryBuilder('item')
			.where('item.id_api = :id_api', { id_api })
			.andWhere('item.tipo = :tipo', { tipo })
			.andWhere(
				`item.user_id IN (
			  SELECT followed_id
			  FROM user_followers
			  WHERE follower_id = :userId
			)`,
				{ userId }
			)
			.getCount();
	}
	async obtenerItemsPopularesEntreSeguidos(
		userId: number,
		limit: number = 5
	): Promise<PopularItem[]> {
		try {
			// Consulta SQL para obtener ítems populares entre seguidos
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
				  SELECT followed_id
				  FROM user_followers
				  WHERE follower_id = ?
				)
			  GROUP BY 
				ui.id_api, ui.tipo
			  ORDER BY 
				COUNT(DISTINCT ui.user_id) DESC,
				MAX(ui.updated_at) DESC
			  LIMIT ?
			`,
					[userId, limit]
				);

			return result;
		} catch (error) {
			console.error('Error al obtener ítems populares:', error);
			return [];
		}
	}
	// Añadir estos métodos en src/repositories/user-item.repository.ts

	/**
	 * Obtiene la actividad reciente de los usuarios que el usuario sigue
	 * @param userId ID del usuario
	 * @param page Número de página (empieza en 1)
	 * @param limit Elementos por página
	 */
	async obtenerActividadSeguidos(
		userId: number,
		page: number = 1,
		limit: number = 10
	): Promise<any[]> {
		// Calcular offset para paginación
		const offset = (page - 1) * limit;

		try {
			type UserActivity = {
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
			};

			const result: UserActivity[] = await this.dataSource.query(
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
		  u.avatar_id
		FROM 
		  user_items ui
		INNER JOIN 
		  users u ON ui.user_id = u.id
		WHERE 
		  ui.user_id IN (
			SELECT followed_id
			FROM user_followers
			WHERE follower_id = ?
		  )
		ORDER BY 
		  ui.updated_at DESC
		LIMIT ? OFFSET ?
		`,
				[userId, limit, offset]
			);

			return result;
		} catch (error) {
			console.error('Error al obtener actividad de seguidos:', error);
			return [];
		}
	}

	/**
	 * Cuenta cuántos contenidos tienen en común dos usuarios
	 * @param userId ID del primer usuario
	 * @param otroUserId ID del segundo usuario
	 * @returns Número de contenidos en común
	 */
	async contarContenidosEnComun(
		userId: number,
		otroUserId: number
	): Promise<number> {
		try {
			const result: { count: number }[] = await this.dataSource.query(
				`
		SELECT COUNT(*) AS count
		FROM (
		  SELECT id_api, tipo
		  FROM user_items
		  WHERE user_id = ?
		) AS mis_items
		INNER JOIN (
		  SELECT id_api, tipo
		  FROM user_items
		  WHERE user_id = ?
		) AS sus_items
		ON mis_items.id_api = sus_items.id_api AND mis_items.tipo = sus_items.tipo
		`,
				[userId, otroUserId]
			);

			return result.length > 0 ? result[0].count : 0;
		} catch (error) {
			console.error('Error al contar contenidos en común:', error);
			return 0;
		}
	}
}

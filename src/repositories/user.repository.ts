// src/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserProfile } from 'src/user/actividad-seguidos.controller';

interface FollowerUser {
	id: number;
	name: string;
	email: string;
	username?: string;
	avatar_id?: string;
	created_at: Date;
}

interface LastActivity {
	id: number;
	id_api: string;
	tipo: string;
	estado: string;
	updated_at: string;
}

@Injectable()
export class UserRepository extends Repository<User> {
	constructor(private readonly dataSource: DataSource) {
		super(User, dataSource.createEntityManager());
	}

	async findUserProfile(userId: number): Promise<UserProfile | null> {
		try {
			const user = await this.findOne({
				where: { id: userId },
				select: ['id', 'name', 'email', 'created_at'],
			});

			// Obtener avatar o nombre de imagen del usuario si existe
			const avatarInfo = await this.dataSource.query<
				{ id: number; avatar_id: string | null }[]
			>(
				`
				SELECT id, avatar_id 
				FROM users 
				WHERE id = ?
			`,
				[userId]
			);

			if (user && avatarInfo.length > 0) {
				return {
					...user,
					avatar: avatarInfo[0].avatar_id || 'avatar1', // Valor por defecto
				};
			}

			if (user) {
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					created_at: user.created_at,
					avatar: 'avatar1', // Default avatar if no avatarInfo is found
				} as UserProfile;
			}
			return null;
		} catch (error) {
			console.error('Error al buscar perfil de usuario:', error);
			return null;
		}
	}

	/**
	 * Cuenta el número de amigos de un usuario
	 */
	async countFriends(userId: number): Promise<number> {
		try {
			const result: { count: number }[] = await this.dataSource.query(
				`
				SELECT COUNT(*) as count
				FROM user_friends
				WHERE user_id = ?
			`,
				[userId]
			);

			return result[0]?.count || 0;
		} catch (error) {
			console.error('Error al contar amigos:', error);
			return 0;
		}
	}

	/**
	 * Verifica si un usuario sigue a otro
	 */
	async checkFollowing(
		userId: number,
		targetUserId: number
	): Promise<boolean> {
		try {
			const result: { count: number }[] = await this.dataSource.query(
				`
				SELECT COUNT(*) as count
				FROM user_followers
				WHERE follower_id = ? AND followed_id = ?
			`,
				[userId, targetUserId]
			);

			return result[0]?.count > 0;
		} catch (error) {
			console.error('Error al verificar seguimiento:', error);
			return false;
		}
	}

	/**
	 * Seguir a un usuario
	 */
	async followUser(userId: number, targetUserId: number): Promise<void> {
		try {
			await this.dataSource.query(
				`
                INSERT INTO user_followers (follower_id, followed_id)
                VALUES (?, ?)
            `,
				[userId, targetUserId]
			);
		} catch (error) {
			console.error('Error al seguir usuario:', error);
			throw error;
		}
	}

	/**
	 * Dejar de seguir a un usuario
	 */
	async unfollowUser(userId: number, targetUserId: number): Promise<void> {
		try {
			await this.dataSource.query(
				`
                DELETE FROM user_followers
                WHERE follower_id = ? AND followed_id = ?
            `,
				[userId, targetUserId]
			);
		} catch (error) {
			console.error('Error al dejar de seguir usuario:', error);
			throw error;
		}
	}

	/**
	 * Actualiza el avatar de un usuario
	 */
	async updateAvatar(userId: number, avatar: string): Promise<void> {
		try {
			await this.dataSource.query(
				`
                UPDATE users
                SET avatar_id = ?
                WHERE id = ?
            `,
				[avatar, userId]
			);
		} catch (error) {
			console.error('Error al actualizar avatar:', error);
			throw error;
		}
	}

	async updateBio(userId: number, bio: string): Promise<void> {
		try {
			await this.dataSource.query(
				`UPDATE users SET bio = ? WHERE id = ?`,
				[bio, userId]
			);
		} catch (error) {
			console.error('Error al actualizar la biografía:', error);
			throw error;
		}
	}

	async countFollowers(userId: number): Promise<number> {
		try {
			const result: { count: number }[] = await this.dataSource.query(
				`
			SELECT COUNT(*) as count
			FROM user_followers
			WHERE followed_id = ?
		  `,
				[userId]
			);

			return result[0]?.count || 0;
		} catch (error) {
			console.error('Error al contar seguidores:', error);
			return 0;
		}
	}

	async countFollowing(userId: number): Promise<number> {
		try {
			const result: { count: number }[] = await this.dataSource.query(
				`
			SELECT COUNT(*) as count
			FROM user_followers
			WHERE follower_id = ?
		  `,
				[userId]
			);

			return result[0]?.count || 0;
		} catch (error) {
			console.error('Error al contar seguidos:', error);
			return 0;
		}
	}

	async searchUsers(query: string): Promise<User[]> {
		try {
			// Buscar usuarios cuyo nombre o username contenga la consulta
			return this.createQueryBuilder('user')
				.where('user.name LIKE :query', { query: `%${query}%` })
				.orWhere('user.username LIKE :query', { query: `%${query}%` }) // Añadimos búsqueda por username
				.orWhere('user.email LIKE :query', { query: `%${query}%` })
				.select([
					'user.id',
					'user.name',
					'user.username', // Incluimos username en los resultados
					'user.email',
					'user.avatar_id', // Incluimos avatar_id
					'user.created_at',
				])
				.take(10) // Limitar resultados
				.getMany();
		} catch (error) {
			console.error('Error al buscar usuarios:', error);
			return [];
		}
	}

	/**
	 * Obtiene la lista de seguidores de un usuario
	 * @param userId ID del usuario
	 * @param page Número de página (empieza en 1)
	 * @param limit Elementos por página
	 * @returns Lista de usuarios que siguen al usuario
	 */
	async getFollowers(
		userId: number,
		page: number = 1,
		limit: number = 10
	): Promise<FollowerUser[]> {
		try {
			const offset = (page - 1) * limit;

			const result: FollowerUser[] = await this.dataSource.query(
				`
				SELECT 
					u.id, 
					u.name, 
					u.email, 
					u.created_at,
					u.avatar_id
				FROM 
					users u
				INNER JOIN 
					user_followers uf ON u.id = uf.follower_id
				WHERE 
					uf.followed_id = ?
				ORDER BY 
					u.name ASC
				LIMIT ? OFFSET ?
				`,
				[userId, limit, offset]
			);

			return result;
		} catch (error) {
			console.error('Error al obtener seguidores:', error);
			return [];
		}
	}

	/**
	 * Obtiene la lista de usuarios a los que sigue un usuario
	 * @param userId ID del usuario
	 * @param page Número de página (empieza en 1)
	 * @param limit Elementos por página
	 * @returns Lista de usuarios seguidos por el usuario
	 */
	async getFollowing(
		userId: number,
		page: number = 1,
		limit: number = 10
	): Promise<FollowerUser[]> {
		try {
			const offset = (page - 1) * limit;

			const result: FollowerUser[] = await this.dataSource.query(
				`
				SELECT 
					u.id, 
					u.name, 
					u.email, 
					u.created_at,
					u.avatar_id
				FROM 
					users u
				INNER JOIN 
					user_followers uf ON u.id = uf.followed_id
				WHERE 
					uf.follower_id = ?
				ORDER BY 
					u.name ASC
				LIMIT ? OFFSET ?
				`,
				[userId, limit, offset]
			);

			return result;
		} catch (error) {
			console.error('Error al obtener usuarios seguidos:', error);
			return [];
		}
	}

	/**
	 * Obtiene la última actividad de un usuario
	 * @param userId ID del usuario
	 * @returns Objeto con la información de la última actividad
	 */
	async getLastActivity(userId: number): Promise<LastActivity | null> {
		try {
			const userItems: LastActivity[] = await this.dataSource.query(
				`
			  SELECT 
				ui.id,
				ui.id_api,
				ui.tipo,
				ui.estado,
				ui.updated_at
			  FROM 
				user_items ui
			  WHERE 
				ui.user_id = ?
			  ORDER BY 
				ui.updated_at DESC
			  LIMIT 1
			  `,
				[userId]
			);

			if (userItems.length === 0) {
				return null;
			}

			return userItems[0];
		} catch (error) {
			console.error('Error al obtener última actividad:', error);
			return null;
		}
	}
}

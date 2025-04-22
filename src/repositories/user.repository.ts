import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
	constructor(private readonly dataSource: DataSource) {
		super(User, dataSource.createEntityManager());
	}

	/**
	 * Encuentra un perfil de usuario con información básica
	 */
	async findUserProfile(userId: number): Promise<any> {
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

			return user;
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
}

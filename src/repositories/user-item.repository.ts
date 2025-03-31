import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { UserItem } from '../entities/user-item.entity';

@Injectable()
export class UserItemRepository extends Repository<UserItem> {
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

	constructor(private readonly dataSource: DataSource) {
		super(UserItem, dataSource.createEntityManager());
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
}

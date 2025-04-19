import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserItem } from '../entities/user-item.entity';
import { AddUserItemDto, UpdateUserItemDto } from './dto/user-item.dto';

@Injectable()
export class UserItemsService {
	constructor(
		@InjectRepository(UserItem)
		private readonly userItemsRepo: Repository<UserItem>
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
}

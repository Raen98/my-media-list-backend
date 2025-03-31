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
}

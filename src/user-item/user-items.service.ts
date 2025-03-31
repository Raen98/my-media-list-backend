import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserItem } from '../entities/user-item.entity';
import { AddUserItemDto } from './user-items.controller';

@Injectable()
export class UserItemsService {
	constructor(
		@InjectRepository(UserItem)
		private readonly userItemsRepo: Repository<UserItem>
	) {}

	async addItemToUser(data: AddUserItemDto, userId: number) {
		const existing = await this.userItemsRepo.findOne({
			where: {
				user: { id: userId },
				id_api: data.id_api,
				tipo: data.tipo,
			},
			relations: ['user'],
		});

		if (existing) {
			return { message: 'Este ítem ya está en tu lista.' };
		}

		const nuevoItem = this.userItemsRepo.create({
			user: { id: userId },
			id_api: data.id_api,
			tipo: data.tipo,
			estado: data.estado,
		});

		await this.userItemsRepo.save(nuevoItem);
		return { message: 'Ítem añadido correctamente.' };
	}
}

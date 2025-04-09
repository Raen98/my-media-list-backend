// src/social/social.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SocialService {
	constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

	async agregarAmigo(userId: number, amigoId: number) {
		const result: { user_id: number; friend_id: number }[] =
			await this.dataSource.query(
				`SELECT * FROM user_friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
				[userId, amigoId, amigoId, userId]
			);

		if (result.length > 0) {
			throw new ConflictException('Ya son amigos');
		}

		// Inserción bidireccional
		await this.dataSource.query(
			`INSERT INTO user_friends (user_id, friend_id) VALUES (?, ?), (?, ?)`,
			[userId, amigoId, amigoId, userId]
		);

		return { mensaje: 'Amistad creada correctamente' };
	}
}

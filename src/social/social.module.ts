// src/social/social.module.ts
import { Module } from '@nestjs/common';
import { SeguidorController } from './seguidor.controller';
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from '../repositories/user-item.repository';
import { DataSource } from 'typeorm';
import { ApisModule } from '../apis/apis.module'; // Importamos el módulo de APIs

@Module({
	imports: [ApisModule],
	controllers: [SeguidorController],
	providers: [
		{
			provide: UserRepository,
			useFactory: (dataSource: DataSource) =>
				new UserRepository(dataSource),
			inject: [DataSource],
		},
		{
			provide: UserItemRepository,
			useFactory: (dataSource: DataSource) =>
				new UserItemRepository(dataSource),
			inject: [DataSource],
		},
	],
})
export class SocialModule {}

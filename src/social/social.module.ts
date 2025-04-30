// src/social/social.module.ts
import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SeguidorController } from './seguidor.controller';
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from '../repositories/user-item.repository';
import { DataSource } from 'typeorm';
import { ApisModule } from '../apis/apis.module'; // Importamos el módulo de APIs

@Module({
	imports: [ApisModule],
	controllers: [SocialController, SeguidorController],
	providers: [
		SocialService,
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

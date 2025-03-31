import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserItem } from '../entities/user-item.entity';
import { UserItemRepository } from '../repositories/user-item.repository';
import { UserItemsController } from './user-items.controller';
import { UserItemsService } from './user-items.service';
import { DataSource } from 'typeorm';

@Module({
	imports: [TypeOrmModule.forFeature([UserItem])],
	controllers: [UserItemsController],
	providers: [
		UserItemsService,
		{
			provide: UserItemRepository,
			useFactory: (dataSource: DataSource) =>
				new UserItemRepository(dataSource),
			inject: [DataSource],
		},
	],
})
export class UserItemsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserItem } from '../entities/user-item.entity';
import { UserItemRepository } from '../repositories/user-item.repository';
import { UserItemsController } from './user-items.controller';
import { UserItemsService } from './user-items.service';
import { DataSource } from 'typeorm';
import { ApisModule } from '../apis/apis.module';

@Module({
	imports: [TypeOrmModule.forFeature([UserItem]), ApisModule],
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
	exports: [UserItemsService],
})
export class UserItemsModule {}

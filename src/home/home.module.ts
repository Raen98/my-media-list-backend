import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserItem } from '../entities/user-item.entity';
import { HomeController } from './home.controller';
import { UserItemRepository } from '../repositories/user-item.repository';
import { DataSource } from 'typeorm';
import { ApisModule } from '../apis/apis.module';

@Module({
	imports: [TypeOrmModule.forFeature([UserItem]), ApisModule],
	controllers: [HomeController],
	providers: [
		{
			provide: UserItemRepository,
			useFactory: (dataSource: DataSource) =>
				new UserItemRepository(dataSource),
			inject: [DataSource],
		},
	],
})
export class HomeModule {}

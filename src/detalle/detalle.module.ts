import { Module } from '@nestjs/common';
import { LibrosController } from './libros.controller';
import { GoogleBooksService } from '../apis/google-books.api';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserItem } from '../entities/user-item.entity';
import { DataSource } from 'typeorm';
import { UserItemRepository } from '../repositories/user-item.repository';

@Module({
	imports: [TypeOrmModule.forFeature([UserItem])],
	controllers: [LibrosController],
	providers: [
		GoogleBooksService,
		{
			provide: UserItemRepository,
			useFactory: (dataSource: DataSource) =>
				new UserItemRepository(dataSource),
			inject: [DataSource],
		},
	],
})
export class DetalleModule {}

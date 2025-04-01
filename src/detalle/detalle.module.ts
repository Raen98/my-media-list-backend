import { Module } from '@nestjs/common';
import { LibrosController } from './libro.controller';
import { GoogleBooksService } from '../apis/google-books.api';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserItem } from '../entities/user-item.entity';
import { DataSource } from 'typeorm';
import { UserItemRepository } from '../repositories/user-item.repository';
import { VideojuegoController } from './videojuego.controller';
import { RawgService } from 'src/apis/rawg.api';
import { TmdbService } from 'src/apis/tmdb.api';
import { PeliculaController } from './pelicula.controller';
import { SerieController } from './serie.controller';

@Module({
	imports: [TypeOrmModule.forFeature([UserItem])],
	controllers: [
		LibrosController,
		VideojuegoController,
		PeliculaController,
		SerieController,
	],
	providers: [
		GoogleBooksService,
		RawgService,
		TmdbService,
		{
			provide: UserItemRepository,
			useFactory: (dataSource: DataSource) =>
				new UserItemRepository(dataSource),
			inject: [DataSource],
		},
	],
})
export class DetalleModule {}

import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { TmdbService } from '../apis/tmdb.api';
import { GoogleBooksService } from '../apis/google-books.api';
import { RawgService } from '../apis/rawg.api';
import { UserItemRepository } from '../repositories/user-item.repository';
import { DataSource } from 'typeorm';

@Module({
	controllers: [SearchController],
	providers: [
		SearchService,
		TmdbService,
		GoogleBooksService,
		RawgService,
		{
			provide: UserItemRepository,
			useFactory: (dataSource: DataSource) =>
				new UserItemRepository(dataSource),
			inject: [DataSource],
		},
	],
})
export class SearchModule {}

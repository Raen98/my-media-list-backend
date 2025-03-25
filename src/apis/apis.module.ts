import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.api';
import { GoogleBooksService } from './google-books.api';
import { RawgService } from './rawg.api';

@Module({
	providers: [TmdbService, GoogleBooksService, RawgService],
	exports: [TmdbService, GoogleBooksService, RawgService],
})
export class ApisModule {}

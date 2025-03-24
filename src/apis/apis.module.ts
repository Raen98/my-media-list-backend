import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.api';
import { GoogleBooksService } from './google-books.api';

@Module({
	providers: [TmdbService, GoogleBooksService],
	exports: [TmdbService, GoogleBooksService],
})
export class ApisModule {}

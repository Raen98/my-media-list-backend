import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.api';

@Module({
	providers: [TmdbService],
	exports: [TmdbService],
})
export class ApisModule {}

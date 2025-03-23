import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ApisModule } from '../apis/apis.module';

@Module({
	imports: [ApisModule],
	controllers: [SearchController],
	providers: [SearchService],
})
export class SearchModule {}

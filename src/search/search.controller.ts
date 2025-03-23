import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '../auth/auth.guard';
import { SearchDto } from './dto/search.dto';

interface AuthRequest extends Request {
	user?: { id: number; email: string };
}

@Controller('buscar')
export class SearchController {
	constructor(private readonly searchService: SearchService) {}

	@Get()
	@UseGuards(AuthGuard)
	async buscar(@Query() params: SearchDto, @Req() req: AuthRequest) {
		return this.searchService.buscar(params, req.user!);
	}
}

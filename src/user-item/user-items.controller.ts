import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UserItemsService } from './user-items.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from 'src/auth/auth-request.interface';

// DTO para validar lo que se envía en el body
export class AddUserItemDto {
	id_api: string;
	tipo: 'P' | 'S' | 'L' | 'V';
	estado: 'P' | 'E' | 'C' | 'A';
}

@Controller('user-items')
export class UserItemsController {
	constructor(private readonly userItemsService: UserItemsService) {}

	@UseGuards(AuthGuard)
	@Post()
	async addItem(@Body() body: AddUserItemDto, @Req() req: AuthRequest) {
		if (!req.user) {
			throw new Error('Token inválido o usuario no autenticado');
		}

		return this.userItemsService.addItemToUser(body, req.user.id);
	}
}

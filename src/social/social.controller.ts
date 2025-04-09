import {
	Controller,
	Post,
	Body,
	Req,
	UseGuards,
	ConflictException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthRequest } from '../auth/auth-request.interface';
import { SocialService } from './social.service';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { AddFriendDto } from './add-friend.dto';

@ApiTags('Social')
@ApiBearerAuth()
@Controller('social')
@UseGuards(AuthGuard)
export class SocialController {
	constructor(private readonly socialService: SocialService) {}

	@Post('amigos')
	@ApiOperation({ summary: 'Enviar solicitud de amistad (bidireccional)' })
	@ApiResponse({ status: 201, description: 'Amistad creada correctamente' })
	@ApiResponse({
		status: 409,
		description: 'Ya son amigos o error en la solicitud',
	})
	async agregarAmigo(@Body() body: AddFriendDto, @Req() req: AuthRequest) {
		if (!req.user) {
			throw new ConflictException('Usuario no autenticado');
		}

		const userId = req.user.id;
		const { amigoId } = body;

		if (userId === amigoId) {
			throw new ConflictException(
				'No puedes añadirte a ti mismo como amigo'
			);
		}

		try {
			return await this.socialService.agregarAmigo(userId, amigoId);
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new ConflictException(
					'Error al agregar amigo: ' + error.message
				);
			}
			throw new ConflictException('Error al agregar amigo');
		}
	}
}

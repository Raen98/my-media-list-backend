// src/social/dto/add-friend.dto.ts
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFriendDto {
	@ApiProperty({
		example: 42,
		description: 'ID del usuario al que se quiere agregar como amigo',
	})
	@IsInt()
	amigoId: number;
}

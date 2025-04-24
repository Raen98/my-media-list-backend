// src/user/dto/search-user.dto.ts
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUserDto {
	@ApiProperty({
		example: 'david',
		description: 'Texto para buscar usuarios por nombre o username',
	})
	@IsString()
	query: string;
}

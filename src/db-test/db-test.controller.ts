import { Controller, Get } from '@nestjs/common';
import { DbTestService } from './db-test.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('DB Test') // 🔹 Aparece como sección "DB Test" en Swagger
@Controller('db-test')
export class DbTestController {
	constructor(private readonly dbTestService: DbTestService) {}

	/**
	 * 🔧 GET /db-test
	 * Comprueba la conexión con la base de datos ejecutando una consulta básica (SELECT 1+1).
	 */
	@Get()
	@ApiOperation({ summary: 'Comprobar conexión con la base de datos' })
	@ApiResponse({
		status: 200,
		description: 'Resultado de una prueba simple de conexión',
	})
	async test(): Promise<{
		success: boolean;
		result?: { result: number }[];
		error?: string;
	}> {
		return this.dbTestService.testConnection();
	}

	/**
	 * GET /db-test/users
	 * Recupera todos los usuarios de la tabla users.
	 */
	@Get('users')
	@ApiOperation({ summary: 'Listar usuarios desde la base de datos' })
	@ApiResponse({
		status: 200,
		description: 'Lista de usuarios en la base de datos',
	})
	async testUsers(): Promise<{
		success: boolean;
		result?: any[];
		error?: string;
	}> {
		return this.dbTestService.testUsers();
	}
}

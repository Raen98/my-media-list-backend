import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // ❌ Quita propiedades que no estén en el DTO
			forbidNonWhitelisted: true, // ⛔ Lanza error si hay propiedades extra
			transform: true, // 🔁 Convierte tipos automáticamente
		})
	);

	// ✅ Habilitar CORS
	app.enableCors({
		origin: '*', // Permite cualquier dominio (⚠️ Solo para pruebas, luego puedes restringirlo)
		methods: 'GET,POST,PUT,DELETE,OPTIONS',
		allowedHeaders: 'Content-Type,Authorization,ngrok-skip-browser-warning',
		exposedHeaders: 'Authorization',
	});
	// Swagger config
	const config = new DocumentBuilder()
		.setTitle('MyMediaList API')
		.setDescription('Documentación de la API de MyMediaList')
		.setVersion('1.0')
		.addBearerAuth() // para el token
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document); // Ruta en /api

	await app.listen(8080);
}
bootstrap();

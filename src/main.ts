import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// ✅ Habilitar CORS
	app.enableCors({
		origin: '*', // Permite cualquier dominio (⚠️ Solo para pruebas, luego puedes restringirlo)
		methods: 'GET,POST,PUT,DELETE,OPTIONS',
		allowedHeaders: 'Content-Type,Authorization,ngrok-skip-browser-warning',
		exposedHeaders: 'Authorization',
	});

	await app.listen(3000);
}
bootstrap();

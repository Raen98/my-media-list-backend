import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbTestModule } from './db-test/db-test.module';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { UserItemsModule } from './user-item/user-items.module';
import { DetalleModule } from './detalle/detalle.module';
import { SocialModule } from './social/social.module';
import { HomeModule } from './home/home.module';
import { UserModule } from './user/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'mysql',
				host: configService.get('DB_HOST'),
				port: +configService.get('DB_PORT'),
				username: configService.get('DB_USERNAME'),
				password: configService.get('DB_PASSWORD'),
				database: configService.get('DB_NAME'),
				entities: [__dirname + '/**/*.entity{.ts,.js}'],
				synchronize: false,
				logging: true,
			}),
			inject: [ConfigService],
		}),
		DbTestModule,
		AuthModule,
		SearchModule,
		UserItemsModule,
		DetalleModule,
		SocialModule,
		HomeModule,
		UserModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}

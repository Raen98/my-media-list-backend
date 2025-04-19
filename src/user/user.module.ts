import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserItem } from '../entities/user-item.entity';
import { PerfilController } from './perfil.controller';
import { ActividadController } from './actividad.controller';
import { AvatarController } from './avatar.controller';
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from 'src/repositories/user-item.repository';
import { DataSource } from 'typeorm';
import { ApisModule } from '../apis/apis.module';

@Module({
	imports: [TypeOrmModule.forFeature([User, UserItem]), ApisModule],
	controllers: [PerfilController, ActividadController, AvatarController],
	providers: [
		{
			provide: UserRepository,
			useFactory: (dataSource: DataSource) =>
				new UserRepository(dataSource),
			inject: [DataSource],
		},
		{
			provide: UserItemRepository,
			useFactory: (dataSource: DataSource) =>
				new UserItemRepository(dataSource),
			inject: [DataSource],
		},
	],
})
export class UserModule {}

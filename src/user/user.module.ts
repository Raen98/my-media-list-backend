import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserItem } from '../entities/user-item.entity';
import { PerfilController } from './perfil.controller';
import { ActividadController } from './actividad.controller';
import { ActividadSeguidosController } from './actividad-seguidos.controller';
import { AvatarController } from './avatar.controller';
import { SearchUserController } from './search-user.controller';
import { SeguidorController } from '../social/seguidor.controller'; // Importamos el nuevo controlador
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from '../repositories/user-item.repository';
import { DataSource } from 'typeorm';
import { ApisModule } from '../apis/apis.module';

@Module({
	imports: [TypeOrmModule.forFeature([User, UserItem]), ApisModule],
	controllers: [
		PerfilController,
		ActividadController,
		AvatarController,
		ActividadSeguidosController,
		SearchUserController,
		SeguidorController,
	],
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

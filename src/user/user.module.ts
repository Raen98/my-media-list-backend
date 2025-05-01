import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserItem } from '../entities/user-item.entity';
import { ActividadSeguidosController } from './actividad-seguidos.controller';
import { SearchUserController } from './search-user.controller';
import { SeguidorController } from '../social/seguidor.controller';
import { UserRepository } from '../repositories/user.repository';
import { UserItemRepository } from '../repositories/user-item.repository';
import { DataSource } from 'typeorm';
import { ApisModule } from '../apis/apis.module';
import { PerfilController } from './perfil.controller';

@Module({
	imports: [TypeOrmModule.forFeature([User, UserItem]), ApisModule],
	controllers: [
		// ActividadController ha sido eliminado
		ActividadSeguidosController,
		SearchUserController,
		SeguidorController,
		PerfilController,
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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbTestService } from './db-test.service';
import { DbTestController } from './db-test.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])], // No necesitamos entidades aún
  controllers: [DbTestController],
  providers: [DbTestService],
})
export class DbTestModule {}

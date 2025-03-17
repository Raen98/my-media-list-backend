import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DbTestService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async testConnection(): Promise<{
    success: boolean;
    result?: { result: number }[];
    error?: string;
  }> {
    try {
      const result: { result: number }[] = await this.dataSource.query(
        'SELECT 1 + 1 AS result',
      );
      return { success: true, result };
    } catch (error: unknown) {
      const errorMessage = isError(error) ? error.message : 'Unknown error';

      function isError(error: unknown): error is Error {
        return error instanceof Error;
      }

      return { success: false, error: errorMessage };
    }
  }
}

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
      const result = await this.dataSource.query<{ result: number }[]>(
        'SELECT 1 + 1 AS result'
      );
      return { success: true, result };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  async testUsers(): Promise<{
    success: boolean;
    result?: any[];
    error?: string;
  }> {
    try {
      const result = await this.dataSource.query<any[]>(
        'SELECT * FROM users LIMIT 1'
      );
      return { success: true, result };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}

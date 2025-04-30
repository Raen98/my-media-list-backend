// src/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserItem } from './user-item.entity';

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	email: string;

	@Column({ unique: true })
	username: string;

	@Column()
	password: string;

	@Column()
	name: string;

	@Column({ type: 'text', nullable: true })
	bio: string;

	@Column({ nullable: true })
	avatar_id: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	created_at: Date;

	@OneToMany(() => UserItem, (userItem) => userItem.user)
	items: UserItem[];
}

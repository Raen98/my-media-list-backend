import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserItem } from './user-item.entity';

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	email: string;

	@Column()
	password: string;

	@Column()
	name: string;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	created_at: Date;

	@OneToMany(() => UserItem, (userItem) => userItem.user)
	items: UserItem[];

	@Column({ type: 'text', nullable: true })
	bio: string;
}

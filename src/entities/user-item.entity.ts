import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToOne,
	Unique,
	JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_items')
@Unique(['user', 'id_api', 'tipo']) //
export class UserItem {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;

	@Column()
	id_api: string;

	@Column({ type: 'enum', enum: ['P', 'S', 'L', 'V'] })
	tipo: 'P' | 'S' | 'L' | 'V';

	@Column({
		type: 'enum',
		enum: ['P', 'E', 'C', 'A'],
		default: 'P',
	})
	estado: 'P' | 'E' | 'C' | 'A';

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	created_at: Date;

	@Column({
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
		onUpdate: 'CURRENT_TIMESTAMP',
	})
	updated_at: Date;
}

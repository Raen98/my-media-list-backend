import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	ManyToOne,
	Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_items')
@Unique(['user', 'id_api', 'tipo']) // 🔹 Evita duplicados
export class UserItem {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, (user) => user.items, { onDelete: 'CASCADE' })
	user: User;

	@Column()
	id_api: string;

	@Column({ type: 'enum', enum: ['P', 'S', 'L', 'V'] })
	tipo: 'P' | 'S' | 'L' | 'V';

	@Column({
		type: 'enum',
		enum: ['pendiente', 'en progreso', 'completado', 'abandonado'],
		default: 'pendiente',
	})
	estado: 'pendiente' | 'en progreso' | 'completado' | 'abandonado';

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	created_at: Date;

	@Column({
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
		onUpdate: 'CURRENT_TIMESTAMP',
	})
	updated_at: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    short_title: string;

    @Column('text')
    description: string;

    @Column()
    thumbnail: string;

    @Column()
    icon: string;

    @Column()
    price_range: string;

    @Column('text', { array: true })
    features: string[];

    @CreateDateColumn()
    created_at: Date;
}

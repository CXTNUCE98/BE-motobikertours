import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class BlogPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column('text')
    excerpt: string;

    @Column('text')
    content: string;

    @Column()
    thumbnail: string;

    @Column()
    category: string;

    @Column()
    author_name: string;

    @Column('text', { array: true })
    tags: string[];

    @CreateDateColumn()
    created_at: Date;
}

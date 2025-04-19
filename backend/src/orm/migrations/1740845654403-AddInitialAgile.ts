import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialAgile1740845654403 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> { 
        await queryRunner.query(`
            INSERT INTO "agile" ( name, type) VALUES 
            ('Проекты', 'Backlog'),
            ('Биржа', 'Sprint backlog'),
            ('Идеи', 'In progress'),
            ('Профиль', 'Completed')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "agile" WHERE name IN ('Проекты', 'Биржа', 'Идеи', 'Профиль')
        `);
    }

}
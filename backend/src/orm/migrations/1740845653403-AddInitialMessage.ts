import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialMessage1740845653403 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "message" ( created_at,message) VALUES 
            (NOW(), 'Это надо изменить'),
            (NOW(), 'Это делаю я')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "message" WHERE message IN ('Это надо изменить', 'Это делаю я')
        `);
    }

}
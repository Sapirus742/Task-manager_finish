import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialExchange1740845652403 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "exchange" ( name,"startExchange","stopExchange") VALUES 
            ('Биржа проектов ВШЦТ', '2024-06-03 00:00:01','2025-06-03 00:00:01'),
            ('Осенняя биржа 2024 (поток ВШЦТ 23)', '2024-09-23 00:00:01','2025-05-30 00:00:01')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "exchange" WHERE name IN ('Биржа проектов ВШЦТ', 'Осенняя биржа 2024 (поток ВШЦТ 23)')
        `);
    }

}
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialIdea1740825689443 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "idea" ( name,problem,solution,result,resource,stack,status,created_at) VALUES 

        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "idea" WHERE name IN ('Ruality - игра для помощи иностранным студентам', 'Чат-бот в telegram для возвращения информации из отчетов Power BI (Например в виде скрина)')
        `);
    }

}

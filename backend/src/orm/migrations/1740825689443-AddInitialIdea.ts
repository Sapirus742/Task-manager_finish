import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialIdea1740825689443 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        `);
    }

}
